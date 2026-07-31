import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

const formatOrderMessage = (order) => {
  return [
    "New Order Received",
    `Order ID: ${order.orderId}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Address: ${order.deliveryAddress}`,
    `Products: ${selectedProductsText(order)}`,
    `Quantity: ${order.quantity ?? "N/A"}`,
    `Total: Rs. ${order.paymentInfo?.totalAmount ?? order.totalAmount ?? 0}`,
    `Status: Pending`,
  ].join("\n");
};

const selectedProductsText = (order) => {
  const items = order.orderItems || [];
  if (!items.length) return "No items";
  return items.map((item) => {
    const color = item.selectedColor || item.color || "—";
    const size = item.selectedSize || item.size || "—";
    return [
      `Product: ${item.name}`,
      `Color: ${color}`,
      `Size: ${size}`,
      `Qty: ${item.quantity}`,
      `Price: Rs. ${item.price?.toLocaleString?.('en-PK') || item.price}`,
      `Subtotal: Rs. ${(item.lineTotal || item.price * item.quantity)?.toLocaleString?.('en-PK') || (item.lineTotal || item.price * item.quantity)}`,
    ].join("\n");
  }).join("\n\n");
};

const normalizeLog = (status, detail) => ({ status, detail, createdAt: new Date().toISOString() });

const persistNotificationState = async (order, notificationLog, notificationStatus) => {
  if (!order?.orderId) return;

  try {
    await updateDoc(doc(db, "orders", order.orderId), {
      notificationLog,
      notificationStatus,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Notification persistence failed, non-critical
  }
};

const sendEmailWithRetry = async (order, message, logEntry) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        logEntry("skipped", "EmailJS environment variables not configured");
        return false;
      }

      const emailPayload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: order.customerEmail,
          customer_email: order.customerEmail || "N/A",
          subject: `Order Confirmation #${order.orderId}`,
          message,
          from_name: order.customerName || "N/A",
          from_email: order.customerEmail || "N/A",
          phone: order.customerPhone || "N/A",
          time: order.orderDate || new Date().toLocaleString(),
          order_total: order.paymentInfo?.totalAmount ?? order.totalAmount ?? 0,
          order_id: order.orderId,
          customer_name: order.customerName || "N/A",
          delivery_address: order.deliveryAddress || "N/A",
        },
      };

      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        throw new Error(`Email request failed with ${response.status}`);
      }

      logEntry("sent", `Email notification sent (attempt ${attempt})`);
      return true;
    } catch (error) {
      if (attempt === 2) {
        logEntry("failed", error.message || "Email notification failed");
        return false;
      }
      logEntry("retrying", "Email notification failed, retrying");
    }
  }

  return false;
};

const sendWhatsAppWithRetry = async (message, logEntry) => {
    try {
      let phone = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
      if (phone.startsWith("0")) {
        phone = "92" + phone.slice(1);
      }

      if (!phone) {
        logEntry("skipped", "WhatsApp number not configured");
        return false;
      }

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      if (typeof window !== "undefined") {
        const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          logEntry("failed", "Browser blocked the WhatsApp popup tab");
          return false;
        }
      }

      logEntry("queued", `WhatsApp notification queued`);
      return true;

    } catch {
      logEntry("failed", "WhatsApp notification failed");
      return false;
    }
};

export const notifyOrder = async (order) => {
  const message = formatOrderMessage(order);
  const notificationLog = [];
  const notificationStatus = { email: "queued", whatsapp: "queued" };

  const logEntry = (status, detail) => {
    notificationLog.push(normalizeLog(status, detail));
  };

  // 1. Pehle Email send hogi
  const emailSent = await sendEmailWithRetry(order, message, logEntry);
  notificationStatus.email = emailSent ? "sent" : "failed";
  await persistNotificationState(order, notificationLog, notificationStatus);

  if (!emailSent) {
    logEntry("skipped", "WhatsApp notification skipped because email failed");
    notificationStatus.whatsapp = "skipped";
    await persistNotificationState(order, notificationLog, notificationStatus);
    return notificationLog;
  }

  // 2. Email theek send hone ke baad WhatsApp ka tab khulega
  const whatsappSent = await sendWhatsAppWithRetry(message, logEntry);
  notificationStatus.whatsapp = whatsappSent ? "sent" : "failed";
  await persistNotificationState(order, notificationLog, notificationStatus);

  return notificationLog;
};
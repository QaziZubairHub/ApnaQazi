import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import Layout from "./Layout";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../util/helpers";
import { notifyOrder } from "../services/orderNotifications";
import { getFriendlyAuthError, signInWithFacebook, signInWithGoogle } from "../services/authService";

const paymentMethods = [
  {
    id: "cod",
    label: "Cash on Delivery",
    desc: "Pay when you receive",
    icon: "ri-truck-line",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    desc: "Visa, Mastercard, Amex",
    icon: "ri-bank-card-line",
  },
  {
    id: "paypal",
    label: "PayPal",
    desc: "Pay with your PayPal balance",
    icon: "ri-paypal-line",
  },
  {
    id: "crypto",
    label: "Crypto",
    desc: "BTC, ETH, USDT",
    icon: "ri-coin-line",
  },
];

const trustBadges = [
  { icon: "ri-shield-check-line", text: "Secure Checkout" },
  { icon: "ri-lock-2-line", text: "256-bit SSL" },
  { icon: "ri-refresh-line", text: "30-Day Returns" },
];

const initialShipping = {
  country: "Pakistan",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  postalCode: "",
  phone: "",
};

const initialCard = {
  number: "",
  name: "",
  expiry: "",
  cvc: "",
};

/* ── Reusable input field (module scope) ──
   MUST live outside the Checkout component. If defined inside, React treats
   it as a brand-new component type on every parent render → the <input>
   unmounts → cursor / focus drops on each keystroke. */
const Field = ({ name, label, type = "text", value, onChange, required, placeholder, full, error }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#336D6F]/15 ${
        error
          ? "border-red-300 focus:border-red-400"
          : "border-gray-200 focus:border-[#336D6F]"
      }`}
    />
    {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart, getTotals } = useCart();
  const { user, userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/Cart", { replace: true });
    }
  }, [cartItems.length, navigate]);

  const { shipping: shippingCost, tax, total } = getTotals(0);
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState(initialShipping);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billing, setBilling] = useState(initialShipping);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [card, setCard] = useState(initialCard);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.email && !email) {
      setEmail(user.email);
    }

    if (!authLoading && userData?.fullname && !shipping.firstName && !shipping.lastName) {
      const fullName = userData.fullname.trim();
      const [firstName, ...rest] = fullName.split(" ");
      setShipping((current) => ({
        ...current,
        firstName: firstName || "",
        lastName: rest.join(" ") || "",
      }));
    }
  }, [authLoading, user, userData, email, shipping.firstName, shipping.lastName]);

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping((s) => ({ ...s, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleBillingChange = (e) =>
    setBilling((b) => ({ ...b, [e.target.name]: e.target.value }));

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "number") v = value.replace(/\D/g, "").slice(0, 16);
    if (name === "expiry")
      v = value
        .replace(/\D/g, "")
        .slice(0, 4)
        .replace(/(\d{2})(\d{1,2})/, "$1/$2");
    if (name === "cvc") v = value.replace(/\D/g, "").slice(0, 4);
    setCard((c) => ({ ...c, [name]: v }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    ["firstName", "lastName", "address", "city", "phone"].forEach((f) => {
      if (!shipping[f]?.trim()) e[f] = "This field is required";
    });
    if (shipping.phone && !/^[+\d\s-]{7,}$/.test(shipping.phone))
      e.phone = "Enter a valid phone number";
    if (paymentMethod === "card") {
      if ((card.number || "").length < 16) e.number = "Enter a 16-digit card number";
      if (!card.name?.trim()) e.name = "Cardholder name is required";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = "MM/YY";
      if ((card.cvc || "").length < 3) e.cvc = "3-4 digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSocialLogin = async (provider) => {
    if (authLoading) return;
    setSocialLoading(provider);
    try {
      if (provider === "google") {
        await signInWithGoogle();
        showToast("success", "Signed in with Google.");
      } else {
        await signInWithFacebook();
        showToast("success", "Signed in with Facebook.");
      }
    } catch (error) {
      showToast("error", getFriendlyAuthError(error?.code));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleCompleteOrder = async (ev) => {
    ev.preventDefault();

    if (authLoading) {
      showToast("info", "Checking your account details...");
      return;
    }

    if (!validate()) {
      console.error("[Checkout] Validation failed. Errors:", errors);
      showToast("error", "Please fix the highlighted fields.");
      return;
    }

    if (loading) return;
    setLoading(true);

    console.log("[Checkout] Auth loading:", authLoading);
    console.log("[Checkout] Current user:", user);

    console.log("[Checkout] Checkout email:", email);
    console.log("[Checkout] Shipping form:", shipping);
    console.log("[Checkout] Billing sameAsShipping:", sameAsShipping);
    console.log("[Checkout] Billing form:", billing);
    console.log("[Checkout] Payment method:", paymentMethod);
    console.log("[Checkout] Card form (sanitized):", {
      number: card.number ? `***${card.number.slice(-4)}` : "",
      name: card.name,
      expiry: card.expiry,
      cvc: card.cvc ? `***${"*".repeat(Math.min(4, card.cvc.length))}` : "",
    });
    console.log("[Checkout] Notes:", notes);
    console.log("[Checkout] Cart items:", cartItems);
    console.log("[Checkout] Totals:", { subtotal, shippingCost, tax, total });

    if (!db) {
      console.error("[Checkout] Firestore db is not initialized (db is falsy)");
    } else {
      console.log("[Checkout] Firestore db is initialized.");
    }

    const customerName = `${shipping.firstName.trim()} ${shipping.lastName.trim()}`.trim();
    const deliveryAddress = [
      shipping.address?.trim(),
      shipping.apartment?.trim(),
      shipping.city?.trim(),
      shipping.postalCode?.trim(),
      shipping.country?.trim(),
    ].filter(Boolean).join(", ");
    const paymentMethodLabel = paymentMethods.find((m) => m.id === paymentMethod)?.label || "Cash on Delivery";
    const quantity = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
    const selectedProducts = cartItems.map((item) => item.name);
    const authProvider = user
      ? user.providerData?.[0]?.providerId === "facebook.com"
        ? "facebook"
        : user.providerData?.[0]?.providerId === "google.com"
          ? "google"
          : "email"
      : "guest";
    const orderFingerprint = [
      authProvider,
      selectedProducts.join("|"),
      shipping.phone.trim(),
      email.trim(),
      total.toFixed(2),
    ].join("::");

    const orderData = {
      userId: user?.uid || null,
      customerUid: user?.uid || null,
      customerName,
      customerEmail: email.trim(),
      customerPhone: shipping.phone.trim(),
      deliveryAddress,
      shippingAddress: shipping,
      billingAddress: sameAsShipping ? shipping : billing,
      selectedProducts,
      quantity,
      subtotal: +subtotal.toFixed(2),
      shippingFee: +shippingCost.toFixed(2),
      totalAmount: +total.toFixed(2),
      paymentMethod: paymentMethodLabel,
      orderItems: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        variant: i.variant || i.color,
        price: +i.price.toFixed(2),
        quantity: i.qty,
        lineTotal: +(i.price * i.qty).toFixed(2),
      })),
      paymentInfo: {
        method: paymentMethodLabel,
        subtotal: +subtotal.toFixed(2),
        shippingCost: +shippingCost.toFixed(2),
        tax: +tax.toFixed(2),
        totalAmount: +total.toFixed(2),
        ...(paymentMethod === "card" ? { last4: card.number.slice(-4) } : {}),
      },
      orderNotes: notes || null,
      orderStatus: "Pending",
      status: "Pending",
      orderDate: new Date().toISOString(),
      authProvider,
      isGuest: !user,
      source: "web_checkout",
      orderFingerprint,
      notificationStatus: {
        email: "queued",
        whatsapp: "queued",
      },
      notificationLog: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const duplicateQuery = query(
        collection(db, "orders"),
        where("orderFingerprint", "==", orderFingerprint)
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) {
        showToast("info", "This order has already been received.");
        setLoading(false);
        return;
      }

      console.log("[Checkout] Orders collection path: /orders/{orderId}");

      const orderRef = doc(collection(db, "orders"));
      console.log("[Checkout] orderRef.id:", orderRef.id);

      const orderPayload = {
        ...orderData,
        orderId: orderRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Pre-flight required fields log (do not change business logic)
      const requiredFields = [
        "customerName",
        "customerEmail",
        "customerPhone",
        "deliveryAddress",
        "totalAmount",
        "orderStatus",
        "paymentMethod",
        "orderItems",
      ];
      const missing = requiredFields.filter((k) => {
        const v = orderPayload?.[k];
        if (k === "orderItems") return !Array.isArray(v) || v.length === 0;
        return v === undefined || v === null || (typeof v === "string" && v.trim().length === 0);
      });
      console.log("[Checkout] Required payload fields missing/invalid:", missing);
      console.log("[Checkout] orderPayload (sanitized):", {
        ...orderPayload,
        // Avoid logging full billing/shipping objects if huge; but keep deliveryAddress string & key values
        shippingAddress: orderPayload.shippingAddress,
        billingAddress: orderPayload.billingAddress,
        shipping: undefined,
      });

      console.log("[Checkout] Firestore write: setDoc /orders/", orderRef.id);

      await setDoc(orderRef, orderPayload);
      console.log("[Checkout] Firestore write succeeded for order.");
      if (user?.uid) {
        console.log("[Checkout] Writing user subcollection: users/", user.uid, "/orders/", orderRef.id);
        await setDoc(doc(db, "users", user.uid, "orders", orderRef.id), orderPayload);
        console.log("[Checkout] User order subcollection write succeeded.");
      } else {
        console.log("[Checkout] Guest checkout; skipping users/{uid}/orders write.");
      }

      console.log("[Checkout] EmailJS/WhatsApp notifications starting (notifyOrder). OrderId:", orderRef.id);
      // Keep existing notify order call intact; just log before/after.
      await notifyOrder({
        ...orderData,
        orderId: orderRef.id,
        paymentMethod: paymentMethodLabel,
      });
      console.log("[Checkout] notifyOrder finished for orderId:", orderRef.id);

      clearCart();
      setConfirmed({ id: orderRef.id, customerEmail: email.trim(), customerName });
      showToast("success", "Order placed successfully! 🎉");
    } catch (error) {
      console.error("[Checkout] Order submission failed:", error);
      console.error(error?.code);
      console.error(error?.message);
      console.error(error?.stack);

      // Keep UI message unchanged, but include the real error in console.
      showToast("error", "Could not place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* ── Toast ── */}
        {toast && (
          <div className="fixed top-5 right-5 z-[100] animate-[fadeIn_0.2s_ease-out]">
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-600"
                  : toast.type === "error"
                  ? "bg-red-500"
                  : "bg-gray-800"
              }`}
            >
              <i
                className={`text-lg ${
                  toast.type === "success"
                    ? "ri-checkbox-circle-line"
                    : toast.type === "error"
                    ? "ri-error-warning-line"
                    : "ri-information-line"
                }`}
              />
              {toast.message}
            </div>
          </div>
        )}

        {/* ── Success / Confirmation Modal ── */}
        {confirmed && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-[fadeIn_0.25s_ease-out]">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <i className="ri-checkbox-circle-fill text-4xl text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Order Confirmed!
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Thank you for your purchase. A confirmation has been sent to{" "}
                <span className="font-medium text-gray-700">
                  {confirmed.customerEmail}
                </span>
                .
              </p>
              <div className="bg-gray-50 rounded-xl py-3 mb-5">
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="font-mono text-sm font-bold text-[#336D6F]">
                  #{confirmed.id}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate("/Cart")}
                  className="flex-1 py-2.5 rounded-xl bg-[#336D6F] hover:bg-[#285557] text-white text-sm font-semibold transition-colors"
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* ── Breadcrumb + Heading ── */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-[#336D6F] transition-colors">
              Home
            </Link>
            <i className="ri-arrow-right-s-line" />
            <Link to="/Cart" className="hover:text-[#336D6F] transition-colors">
              Cart
            </Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-gray-800 font-medium">Checkout</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Secure Checkout
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <i className="ri-lock-2-line text-[#336D6F]" />
                Your information is protected with 256-bit SSL encryption
              </p>
            </div>
            <Link
              to="/Cart"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#336D6F] hover:text-[#285557] transition-colors self-start sm:self-auto"
            >
              <i className="ri-arrow-left-line" />
              Back to Cart
            </Link>
          </div>

          <form
            onSubmit={handleCompleteOrder}
            className="flex flex-col lg:flex-row gap-6 items-start"
          >
            {/* ───────────── LEFT: Forms ───────────── */}
            <div className="flex-1 w-full space-y-5">
              {/* ── Contact ── */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <span className="w-7 h-7 rounded-full bg-[#336D6F] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    Contact
                  </h2>
                  {user ? (
                    <span className="text-xs font-medium text-gray-600">
                      Signed in as {user.email}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/admin/login", { state: { from: { pathname: "/Checkout" } } })}
                      className="text-xs font-medium text-[#336D6F] hover:text-[#285557]"
                    >
                      Log in
                    </button>
                  )}
                </div>
                {!user && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 space-y-2">
                    <p>Sign in to track your orders, or continue as a guest to place your order.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          document.querySelector('input[name="email"]')?.focus();
                          showToast("info", "You can continue without signing in.");
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Continue as Guest
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocialLogin("google")}
                        disabled={socialLoading === "google"}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {socialLoading === "google" ? "Signing in..." : "Sign in with Google"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocialLogin("facebook")}
                        disabled={socialLoading === "facebook"}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {socialLoading === "facebook" ? "Signing in..." : "Sign in with Facebook"}
                      </button>
                    </div>
                  </div>
                )}
                <Field
                  name="email"
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  required
                  placeholder="you@example.com"
                  full
                  error={errors.email}
                />
                <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#336D6F] focus:ring-[#336D6F]"
                  />
                  Email me with news and exclusive offers
                </label>
              </section>

              {/* ── Delivery ── */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#336D6F] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  Delivery Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Country / Region
                    </label>
                    <select
                      name="country"
                      value={shipping.country}
                      onChange={handleShippingChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#336D6F] focus:ring-2 focus:ring-[#336D6F]/15"
                    >
                      <option>Pakistan</option>
                      <option>United Arab Emirates</option>
                      <option>United Kingdom</option>
                      <option>United States</option>
                    </select>
                  </div>
                  <Field name="firstName" label="First name" value={shipping.firstName} onChange={handleShippingChange} required placeholder="John" error={errors.firstName} />
                  <Field name="lastName" label="Last name" value={shipping.lastName} onChange={handleShippingChange} required placeholder="Doe" error={errors.lastName} />
                  <Field name="address" label="Address" value={shipping.address} onChange={handleShippingChange} required placeholder="House #, Street, Area" full error={errors.address} />
                  <Field name="apartment" label="Apartment, suite, etc." value={shipping.apartment} onChange={handleShippingChange} placeholder="Optional" full />
                  <Field name="city" label="City" value={shipping.city} onChange={handleShippingChange} required placeholder="Karachi" error={errors.city} />
                  <Field name="postalCode" label="Postal code" value={shipping.postalCode} onChange={handleShippingChange} placeholder="Optional" />
                  <div className="md:col-span-2">
                    <Field name="phone" type="tel" label="Phone" value={shipping.phone} onChange={handleShippingChange} required placeholder="+92 300 1234567" full error={errors.phone} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Order notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Delivery instructions, landmark, etc."
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#336D6F] focus:ring-2 focus:ring-[#336D6F]/15 resize-none"
                  />
                </div>
              </section>

              {/* ── Billing ── */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#336D6F] text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  Billing Address
                </h2>
                <div className="space-y-1">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      sameAsShipping
                        ? "border-[#336D6F] bg-[#336D6F]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={sameAsShipping}
                      onChange={() => setSameAsShipping(true)}
                      className="w-4 h-4 text-[#336D6F] focus:ring-[#336D6F]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Same as shipping address
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      !sameAsShipping
                        ? "border-[#336D6F] bg-[#336D6F]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={!sameAsShipping}
                      onChange={() => setSameAsShipping(false)}
                      className="w-4 h-4 text-[#336D6F] focus:ring-[#336D6F]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use a different billing address
                    </span>
                  </label>

                  {!sameAsShipping && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-gray-50 rounded-xl">
                      <div className="md:col-span-2">
                        <select
                          name="country"
                          value={billing.country}
                          onChange={handleBillingChange}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#336D6F]"
                        >
                          <option>Pakistan</option>
                          <option>United Arab Emirates</option>
                          <option>United Kingdom</option>
                        </select>
                      </div>
                      <Field name="firstName" label="First name" value={billing.firstName} onChange={handleBillingChange} placeholder="John" />
                      <Field name="lastName" label="Last name" value={billing.lastName} onChange={handleBillingChange} placeholder="Doe" />
                      <Field name="address" label="Address" value={billing.address} onChange={handleBillingChange} placeholder="Address" full />
                      <Field name="city" label="City" value={billing.city} onChange={handleBillingChange} placeholder="City" />
                      <Field name="postalCode" label="Postal code" value={billing.postalCode} onChange={handleBillingChange} placeholder="Postal code" />
                      <div className="md:col-span-2">
                        <Field name="phone" type="tel" label="Phone" value={billing.phone} onChange={handleBillingChange} placeholder="+92 300 1234567" full />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Payment ── */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#336D6F] text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  Payment Method
                </h2>
                <div className="space-y-2">
                  {paymentMethods.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? "border-[#336D6F] bg-[#336D6F]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="w-4 h-4 text-[#336D6F] focus:ring-[#336D6F]"
                      />
                      <i className={`${m.icon} text-xl text-[#336D6F]`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {m.label}
                        </p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Card details (conditional) */}
                {paymentMethod === "card" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                    <div className="md:col-span-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        Card details
                      </span>
                      <div className="flex gap-2 text-2xl text-gray-400">
                        <i className="ri-visa-line" />
                        <i className="ri-mastercard-line" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Field
                        name="number"
                        label="Card number"
                        value={card.number}
                        onChange={handleCardChange}
                        placeholder="1234 5678 9012 3456"
                        full
                        error={errors.number}
                      />
                    </div>
                    <Field name="name" label="Cardholder name" value={card.name} onChange={handleCardChange} placeholder="JOHN DOE" error={errors.name} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field name="expiry" label="Expiry" value={card.expiry} onChange={handleCardChange} placeholder="MM/YY" error={errors.expiry} />
                      <Field name="cvc" label="CVC" value={card.cvc} onChange={handleCardChange} placeholder="123" error={errors.cvc} />
                    </div>
                    <p className="md:col-span-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <i className="ri-lock-2-line" />
                      Your card details are encrypted and never stored.
                    </p>
                  </div>
                )}
              </section>

              {/* ── Submit (mobile-friendly bottom) ── */}
              <button
                type="submit"
                disabled={loading || authLoading}
                className={`w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                  loading || authLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#336D6F] hover:bg-[#285557] shadow-[#336D6F]/25"
                }`}
              >
                {loading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-lg" />
                    Placing your order…
                  </>
                ) : (
                  <>
                    <i className="ri-lock-2-line text-lg" />
                    Complete Order · {formatCurrency(total)}
                  </>
                )}
              </button>
              <p className="text-[11px] text-gray-400 text-center -mt-2">
                By placing your order you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>

            {/* ───────────── RIGHT: Order Summary ───────────── */}
            <aside className="w-full lg:w-[380px] lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center justify-between">
                  Order Summary
                  <span className="text-xs font-normal text-gray-400">
                    {cartItems.length} items
                  </span>
                </h3>

                {/* Items */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="ri-image-line text-xl text-gray-300" />
                          )}
                        </div>
                        <span className="absolute -top-2 -right-2 bg-[#336D6F] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">
                          {item.name}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-gray-500">{item.variant}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2.5 text-sm pt-4 mt-4 border-t border-gray-100">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-800 font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="text-gray-800 font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-600 font-semibold">FREE</span>
                      ) : (
                        formatCurrency(shippingCost)
                      )}
                    </span>
                  </div>
                  {tax > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Tax</span>
                    <span className="text-gray-800 font-medium">
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(total)}
                    </span>
                    <p className="text-[11px] text-gray-400">incl. delivery</p>
                  </div>
                </div>
              </div>

              {/* Discount code */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="ri-coupon-3-line text-[#c79864]" />
                  Have a promo code?
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#336D6F] focus:ring-2 focus:ring-[#336D6F]/10"
                  />
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {trustBadges.map((badge) => (
                    <div
                      key={badge.text}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#336D6F]/10 flex items-center justify-center">
                        <i className={`${badge.icon} text-[#336D6F] text-lg`} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 leading-tight">
                        {badge.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

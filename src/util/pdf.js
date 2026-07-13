import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./helpers";

// ApnaQazi branded invoice PDF generator.
// `inv` shape: { invoiceNumber, customerName, customerEmail, status,
//               items:[{productTitle, qty, price, total}], subtotal,
//               taxAmount, discount, total, createdAt }
export const generateInvoicePDF = (inv) => {
  const doc = new jsPDF();

  // ── Header / brand ──
  doc.setFontSize(22);
  doc.setTextColor(91, 61, 245); // primary #5B3DF5
  doc.text("INVOICE", 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("ApnaQazi", 20, 32);

  // ── Meta ──
  doc.text(`Invoice #: ${inv.invoiceNumber || "—"}`, 20, 44);
  doc.text(`Date: ${formatDate(inv.createdAt)}`, 20, 50);
  doc.text(`Customer: ${inv.customerName || "N/A"}`, 20, 56);
  doc.text(`Email: ${inv.customerEmail || "N/A"}`, 20, 62);
  doc.text(`Status: ${(inv.status || "unpaid").toUpperCase()}`, 20, 68);

  // ── Items table ──
  autoTable(doc, {
    startY: 78,
    theme: "grid",
    head: [["Item", "Qty", "Price", "Total"]],
    headStyles: { fillColor: [91, 61, 245] },
    body: (inv.items || []).map((i) => [
      i.productTitle || "Unknown",
      String(i.qty ?? ""),
      formatCurrency(i.price),
      formatCurrency(i.total),
    ]),
  });

  // ── Totals ──
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`Subtotal: ${formatCurrency(inv.subtotal)}`, 140, finalY);
  doc.text(`Tax: ${formatCurrency(inv.taxAmount || 0)}`, 140, finalY + 7);
  doc.text(`Discount: -${formatCurrency(inv.discount || 0)}`, 140, finalY + 14);
  doc.setFontSize(13);
  doc.setTextColor(91, 61, 245);
  doc.text(`TOTAL: ${formatCurrency(inv.total)}`, 140, finalY + 26);

  // ── Footer ──
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 20, finalY + 40);

  doc.save(`${inv.invoiceNumber || "invoice"}.pdf`);
};

export default generateInvoicePDF;

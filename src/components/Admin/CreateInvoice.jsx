import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus, X, FileDown, ArrowLeft } from "lucide-react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Button from "../ui/Button";
import useProducts from "../../hooks/useProducts";
import useCustomers from "../../hooks/useCustomers";
import { formatCurrency } from "../../util/helpers";
import { generateInvoicePDF } from "../../util/pdf";

// Build next invoice number from existing docs
const generateInvoiceNumber = async () => {
  try {
    const snap = await getDocs(collection(db, "invoices"));
    let max = 0;
    snap.forEach((d) => {
      const last = d.data()?.invoiceNumber || "";
      const m = last.match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return `INV-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
  } catch {
    return `INV-${new Date().getFullYear()}-0001`;
  }
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const activeProducts = products.filter((p) => (p.status || "active") === "active");

  const addItem = () => setItems((prev) => [...prev, { productId: "", qty: 1, price: 0 }]);
  const updateItem = (i, key, value) =>
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      // product select -> pull its price automatically
      if (key === "productId") {
        const p = activeProducts.find((x) => x.id === value);
        if (p) next[i].price = Number(p.price) || 0;
      }
      return next;
    });
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0),
    [items]
  );
  const taxAmount = subtotal * ((Number(tax) || 0) / 100);
  const total = Math.max(0, subtotal + taxAmount - (Number(discount) || 0));

  const previewInvoice = useMemo(() => {
    const customer = customers.find((c) => c.id === customerId);
    return {
      invoiceNumber: "PREVIEW",
      customerName: customer?.fullName || customer?.name || customer?.email,
      customerEmail: customer?.email,
      status: "unpaid",
      items: items.map((it) => {
        const p = activeProducts.find((x) => x.id === it.productId);
        return {
          productTitle: p?.name || p?.title || "—",
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0,
          total: (Number(it.price) || 0) * (Number(it.qty) || 0),
        };
      }),
      subtotal, taxAmount, discount, total,
      createdAt: new Date(),
    };
  }, [customerId, customers, items, activeProducts, subtotal, taxAmount, discount, total]);

  const handleDownloadPreview = () => {
    if (items.length === 0) { toast.error("Pehle line items add karein."); return; }
    generateInvoicePDF(previewInvoice);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!customerId) { toast.error("Customer select karein."); return; }
    if (items.length === 0) { toast.error("Kam az kam ek item add karein."); return; }
    if (items.some((it) => !it.productId)) { toast.error("Har item ke liye product select karein."); return; }

    setSaving(true);
    try {
      const invoiceNumber = await generateInvoiceNumber();
      const customer = customers.find((c) => c.id === customerId);
      const itemsData = items.map((it) => {
        const p = activeProducts.find((x) => x.id === it.productId);
        return {
          productId: it.productId,
          productTitle: p?.name || p?.title || "",
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0,
          total: (Number(it.price) || 0) * (Number(it.qty) || 0),
        };
      });

      await addDoc(collection(db, "invoices"), {
        invoiceNumber,
        customerId,
        customerName: customer?.fullName || customer?.name || "",
        customerEmail: customer?.email || "",
        items: itemsData,
        subtotal,
        tax: Number(tax) || 0,
        taxAmount,
        discount: Number(discount) || 0,
        total,
        status: "unpaid",
        notes: notes.trim(),
        createdAt: serverTimestamp(),
      });

      toast.success(`Invoice ${invoiceNumber} ban gayi!`);
      navigate("/admin/payment");
    } catch {
      toast.error("Invoice banane mein masla ho gaya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/payment")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Payments
          </button>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Billing</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Invoice</h1>
          <p className="mt-1 text-sm text-slate-500">Customer ke liye nayi invoice generate karein</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <Card hover={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || c.name || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          {/* Line items */}
          <Card hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                Koi item nahi. “Add Item” par click karke shuru karein.
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-end gap-2.5 rounded-[12px] border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <div className="flex-1 min-w-[160px]">
                      <span className="block text-[10px] font-semibold text-slate-400 mb-1">Product</span>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(i, "productId", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select product…</option>
                        {activeProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.title} — {formatCurrency(p.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16">
                      <span className="block text-[10px] font-semibold text-slate-400 mb-1">Qty</span>
                      <input
                        type="number" min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-24">
                      <span className="block text-[10px] font-semibold text-slate-400 mb-1">Price</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={item.price}
                        onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="block text-[10px] font-semibold text-slate-400 mb-1">Total</span>
                      <p className="text-sm font-semibold text-slate-800 py-2.5">
                        {formatCurrency((item.price || 0) * (item.qty || 0))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Tax / discount */}
          <Card hover={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tax (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Discount (Rs)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-1">
          <Card hover={false} className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Summary</h3>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax ({tax || 0}%)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="font-semibold text-red-600">-{formatCurrency(discount)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                <span className="text-slate-700 font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Button type="submit" loading={saving} className="w-full" icon={FileText}>
                {saving ? "Creating…" : "Create Invoice"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                icon={FileDown}
                onClick={handleDownloadPreview}
              >
                Download PDF Preview
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/admin/payment")}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;

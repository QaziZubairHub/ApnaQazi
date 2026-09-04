import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet, Clock, FileText, FileDown, Check,
  Plus, Search,
} from "lucide-react";
import { db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import useInvoices from "../../hooks/useInvoices";
import { formatCurrency, formatDate } from "../../util/helpers";
import { generateInvoicePDF } from "../../util/pdf";

const samplePayments = [
  { id: "p1", customerName: "Qazi Zubair", email: "qazizubairleo@gmail.com", mobile: "+923012991483", date: "2026-05-18 11:10:45 PM", amount: 4500, method: "Cash on Delivery", status: "Completed" },
  { id: "p2", customerName: "Sania Riaz", email: "sania.riyaz@example.com", mobile: "+923001112233", date: "2026-05-15 3:22:10 PM", amount: 7600, method: "Credit Card", status: "Completed" },
  { id: "p3", customerName: "Ayesha Khan", email: "ayesha.khan@example.com", mobile: "+923123445566", date: "2026-05-22 9:45:30 AM", amount: 3200, method: "JazzCash", status: "Pending" },
  { id: "p4", customerName: "Ali Ahmed", email: "ali.ahmed@example.com", mobile: "+923455667788", date: "2026-05-20 6:30:00 PM", amount: 8900, method: "Bank Transfer", status: "Completed" },
  { id: "p5", customerName: "Fatima Noor", email: "fatima@example.com", mobile: "+923211223344", date: "2026-05-19 1:15:20 PM", amount: 1500, method: "Cash on Delivery", status: "Completed" },
];

const Payment = () => {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();
  const [tab, setTab] = useState("transactions"); // 'transactions' | 'invoices'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (inv.invoiceNumber || "").toLowerCase().includes(q) ||
        (inv.customerName || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);
  const totalUnpaid = invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + (i.total || 0), 0);

  const markPaid = async (inv) => {
    try {
      await updateDoc(doc(db, "invoices", inv.id), {
        status: "paid",
        paidAt: serverTimestamp(),
      });
      toast.success(`${inv.invoiceNumber} — Paid mark ho gayi.`);
    } catch (err) {
      toast.error("Masla: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Finance</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Track transactions & invoices</p>
        </div>
        <Button icon={Plus} onClick={() => navigate("/admin/invoices/create")}>
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(samplePayments.reduce((a, p) => a + p.amount, 0))}</p>
            </div>
          </div>
        </Card>
        <Card hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Invoices Paid</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Invoices Unpaid</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalUnpaid)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-[12px] w-fit">
        {[
          { key: "transactions", label: "Transactions" },
          { key: "invoices", label: "Invoices" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all ${
              tab === t.key ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      {tab === "transactions" && (
        <Card padding={false} hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Method</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {samplePayments.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                          {p.customerName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="font-medium text-slate-800">{p.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{p.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell">{p.method}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs hidden sm:table-cell">{p.date}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={p.status === "Completed" ? "Delivered" : "Pending"} size="sm" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invoices table */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices…"
                className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <Card padding={false} hover={false}>
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Invoices load ho rahe hain…</div>
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                title="Koi invoice nahi"
                description="Pehli invoice banayein."
                icon={FileText}
                action={() => navigate("/admin/invoices/create")}
                actionLabel="Create Invoice"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Invoice</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Customer</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv, idx) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-800 font-medium">{inv.customerName || "—"}</p>
                          <p className="text-xs text-slate-400">{inv.customerEmail || ""}</p>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{formatCurrency(inv.total)}</td>
                        <td className="px-5 py-3.5">
                          <Badge status={inv.status === "paid" ? "Delivered" : inv.status === "refunded" ? "cancelled" : "Pending"} size="sm">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs hidden sm:table-cell">{formatDate(inv.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => generateInvoicePDF(inv)}
                              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Download PDF"
                            >
                              <FileDown size={13} />
                            </button>
                            {inv.status === "unpaid" && (
                              <button
                                onClick={() => markPaid(inv)}
                                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Mark as Paid"
                              >
                                <Check size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payment;

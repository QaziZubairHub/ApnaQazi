import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Trash2, Plus } from "lucide-react";
import { db } from "../../firebase";
import {
  collection, addDoc, deleteDoc, doc, getDocs,
  query, where, serverTimestamp, updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import useCoupons from "../../hooks/useCoupons";
import { formatCurrency, formatDate } from "../../util/helpers";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const emptyForm = {
  code: "", type: "percentage", value: "", minOrder: 0,
  usageLimit: 100, startDate: "", expiryDate: "", enabled: true,
};

const Coupons = () => {
  const { coupons, loading } = useCoupons();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) { toast.error("Coupon code zaroori hai."); return; }
    const valueNum = parseFloat(form.value);
    if (!valueNum || valueNum <= 0) { toast.error("Value 0 se zyada honi chahiye."); return; }
    if (form.type === "percentage" && valueNum > 100) { toast.error("Percentage 100 se zyada nahi ho sakti."); return; }

    setSaving(true);
    try {
      // duplicate check
      const dup = await getDocs(query(collection(db, "coupons"), where("code", "==", code)));
      if (!dup.empty) { toast.error("Yeh code pehle se mojood hai."); setSaving(false); return; }

      await addDoc(collection(db, "coupons"), {
        code,
        type: form.type,
        value: valueNum,
        minOrder: parseFloat(form.minOrder) || 0,
        usageLimit: parseInt(form.usageLimit) || 100,
        usedCount: 0,
        startDate: form.startDate ? new Date(form.startDate) : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        enabled: form.enabled,
        createdAt: serverTimestamp(),
      });

      toast.success(`Coupon ${code} ban gaya!`);
      setForm(emptyForm);
    } catch (err) {
      toast.error("Masla: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    try {
      await deleteDoc(doc(db, "coupons", coupon.id));
      toast.success(`Coupon ${coupon.code} delete ho gaya.`);
    } catch (err) {
      toast.error("Masla: " + err.message);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { enabled: !coupon.enabled });
      toast.success(coupon.enabled ? `${coupon.code} disabled.` : `${coupon.code} enabled.`);
    } catch (err) {
      toast.error("Masla: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Promotions</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons</h1>
        <p className="mt-1 text-sm text-slate-500">Discount coupons create aur manage karein</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <div className="lg:col-span-1">
          <Card hover={false} className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-5">
              <Ticket size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-800">New Coupon</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Coupon Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  className={`${inputClass} uppercase font-mono`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (Rs)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Value *</label>
                  <div className="relative">
                    <input
                      type="number" step="0.01" min="0"
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder="0"
                      className={inputClass}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      {form.type === "percentage" ? "%" : "Rs"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Min Order (Rs)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.minOrder}
                    onChange={(e) => set("minOrder", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Usage Limit</label>
                  <input
                    type="number" min="1"
                    value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.enabled ? "true" : "false"}
                  onChange={(e) => set("enabled", e.target.value === "true")}
                  className={inputClass}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <Button type="submit" loading={saving} className="w-full" icon={Plus}>
                {saving ? "Creating…" : "Create Coupon"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Existing coupons */}
        <div className="lg:col-span-2">
          <Card padding={false} hover={false}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Existing Coupons</h3>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Coupons load ho rahe hain…</div>
            ) : coupons.length === 0 ? (
              <EmptyState
                title="Koi coupon nahi"
                description="Pehla coupon banane ke liye form bharein."
                icon={Ticket}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Code</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Value</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Usage</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Expiry</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c, idx) => {
                      const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-800">{c.code}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-medium">
                            {c.type === "percentage" ? `${c.value}%` : formatCurrency(c.value)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">
                            {c.usedCount || 0} / {c.usageLimit}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              status={isExpired ? "cancelled" : c.enabled ? "Delivered" : "cancelled"}
                              size="sm"
                            >
                              {isExpired ? "expired" : c.enabled ? "enabled" : "disabled"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">
                            {formatDate(c.expiryDate)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleToggle(c)}
                                className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors ${
                                  c.enabled
                                    ? "text-primary hover:bg-primary/10"
                                    : "text-slate-400 hover:bg-slate-100"
                                }`}
                                title={c.enabled ? "Disable" : "Enable"}
                              >
                                <i className={`ri-toggle-${c.enabled ? "fill" : "line"} text-base`} />
                              </button>
                              <button
                                onClick={() => handleDelete(c)}
                                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Coupons;

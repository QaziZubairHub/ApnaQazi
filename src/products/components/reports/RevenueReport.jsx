import { useState, useEffect, useCallback } from "react";
import { DollarSign, Calendar, RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "../../../util/helpers";
import {
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  getRevenueReport,
} from "../../../services/reportService";

const RANGES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
];

export function RevenueReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("monthly");
  const [data, setData] = useState(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (range) {
        case "daily":
          result = await getDailyRevenue();
          break;
        case "weekly":
          result = await getWeeklyRevenue();
          break;
        case "monthly":
          result = await getMonthlyRevenue();
          break;
        case "yearly":
          result = await getYearlyRevenue();
          break;
        case "custom":
          if (customStart && customEnd) {
            result = await getRevenueReport(new Date(customStart), new Date(customEnd));
          } else {
            result = await getMonthlyRevenue();
          }
          break;
        default:
          result = await getMonthlyRevenue();
      }
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!data) return;
    const header = "Metric,Value\n";
    const rows = `Revenue,${data.revenue}\nOrders,${data.orderCount}\nStart,${data.startDate || ""}\nEnd,${data.endDate || ""}`;
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `revenue-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load revenue data</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button onClick={load} className="mt-3 px-4 py-2 rounded-[12px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Revenue Report</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sales revenue across time periods</p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors">
              <Download size={14} /> Export CSV
            </button>
          )}
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-[10px]">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${range === r.value ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700" />
          </div>
          <span className="text-xs text-slate-400">to</span>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700" />
          </div>
          <button onClick={load} className="px-3 py-2 rounded-[12px] bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">Apply</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-slate-200/80 bg-white p-5">
              <div className="h-4 w-16 bg-slate-100 rounded mb-3" />
              <div className="h-8 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <DollarSign size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(data.revenue)}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                  <TrendingUp size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">Order Count</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{data.orderCount}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                  <TrendingDown size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">Avg. Order Value</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.orderCount > 0 ? formatCurrency(Math.round(data.revenue / data.orderCount)) : "—"}
              </p>
            </div>
          </div>

          {data.startDate && (
            <p className="text-xs text-slate-400">
              Period: {formatDate(data.startDate)} — {data.endDate ? formatDate(data.endDate) : "now"}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
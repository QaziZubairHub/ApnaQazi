import { useState, useEffect, useCallback } from "react";
import { Package, Eye, Archive, Star, DollarSign, ShoppingCart, Users, Tag, Layers, RefreshCw } from "lucide-react";
import { formatCurrency } from "../../../util/helpers";
import { getDashboardOverview } from "../../../services/reportService";

export function DashboardSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardOverview();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load dashboard overview</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button onClick={load} className="mt-3 px-4 py-2 rounded-[12px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Retry</button>
      </div>
    );
  }

  const cards = loading ? null : [
    { label: "Total Products", value: data.totalProducts, icon: Package, color: "from-indigo-500 to-purple-600" },
    { label: "Published", value: data.publishedProducts, icon: Eye, color: "from-emerald-500 to-teal-600" },
    { label: "Draft", value: data.draftProducts, icon: Archive, color: "from-amber-500 to-orange-600" },
    { label: "Featured", value: data.featuredProducts, icon: Star, color: "from-yellow-500 to-amber-600" },
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingCart, color: "from-blue-500 to-cyan-600" },
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "from-green-500 to-emerald-600" },
    { label: "Categories", value: data.totalCategories, icon: Tag, color: "from-violet-500 to-purple-600" },
    { label: "Brands", value: data.totalBrands, icon: Users, color: "from-pink-500 to-rose-600" },
    { label: "Collections", value: data.totalCollections, icon: Layers, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Dashboard Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">Complete overview of products, orders, and catalog</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-slate-200/80 bg-white p-5">
              <div className="h-10 w-10 rounded-[12px] bg-slate-100 mb-3" />
              <div className="h-4 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-8 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                  <card.icon size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 font-medium">Pending Orders</p>
            <p className="text-xl font-bold text-amber-600">{data.pendingOrders}</p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 font-medium">Completed Orders</p>
            <p className="text-xl font-bold text-emerald-600">{data.completedOrders}</p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 font-medium">Cancelled Orders</p>
            <p className="text-xl font-bold text-red-600">{data.cancelledOrders}</p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 font-medium">Avg. Price</p>
            <p className="text-xl font-bold text-slate-700">{formatCurrency(data.averagePrice)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
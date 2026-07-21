import { useState, useEffect, useCallback } from "react";
import { FileEdit, Archive, Star, Flame, Sparkles, RefreshCw, Download } from "lucide-react";
import { formatCurrency, formatDate } from "../../../util/helpers";
import {
  getDraftProducts,
  getArchivedProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewProducts,
} from "../../../services/reportService";
import Card from "../../../components/ui/Card";

export function ProductReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [archived, setArchived] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newProducts, setNewProducts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, a, f, b, n] = await Promise.all([
        getDraftProducts(),
        getArchivedProducts(),
        getFeaturedProducts(),
        getBestSellers(10),
        getNewProducts(30),
      ]);
      setDrafts(d);
      setArchived(a);
      setFeatured(f);
      setBestSellers(b);
      setNewProducts(n);
    } catch (err) {
      setError(err.message || "Failed to load product data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = (data, name) => {
    if (!data.length) return;
    const header = "Name,SKU,Price,Status\n";
    const rows = data.map((p) => `${p.name || "Untitled"},${p.sku || ""},${p.price ?? 0},${p.status || "draft"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load product data</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button onClick={load} className="mt-3 px-4 py-2 rounded-[12px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Product Report</h3>
          <p className="text-xs text-slate-500 mt-0.5">Draft, archived, featured, best sellers, and new products</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[16px] border border-slate-200 bg-white p-4">
              <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
              {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-8 bg-slate-50 rounded mb-2" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <ProductListCard title="Draft Products" data={drafts} icon={FileEdit} color="text-amber-600" emptyMsg="No draft products" onExport={() => exportCSV(drafts, "draft-products")} />
          <ProductListCard title="Archived Products" data={archived} icon={Archive} color="text-slate-600" emptyMsg="No archived products" onExport={() => exportCSV(archived, "archived-products")} />
          <ProductListCard title="Featured Products" data={featured} icon={Star} color="text-yellow-600" emptyMsg="No featured products" onExport={() => exportCSV(featured, "featured-products")} />
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <BestSellersCard data={bestSellers} loading={loading} onExport={() => exportCSV(bestSellers, "best-sellers")} />
        <NewProductsCard data={newProducts} loading={loading} onExport={() => exportCSV(newProducts, "new-products")} />
      </div>
    </div>
  );
}

function ProductListCard({ title, data, icon: Icon, color, emptyMsg, onExport }) {
  return (
    <Card padding={false} hover={false}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <h4 className="text-sm font-bold text-slate-800">{title} <span className="text-slate-400 font-normal">({data.length})</span></h4>
        </div>
        {data.length > 0 && (
          <button onClick={onExport} className="text-slate-400 hover:text-primary transition-colors" title="Export CSV"><Download size={14} /></button>
        )}
      </div>
      <div className="overflow-auto max-h-64">
        {data.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">{emptyMsg}</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-700 truncate max-w-[160px]">{p.name || "Untitled"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{p.sku || "—"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{p.price != null ? formatCurrency(p.price) : "—"}</td>
                </tr>
              ))}
              {data.length > 20 && <tr><td colSpan={3} className="px-4 py-2 text-center text-xs text-slate-400">…and {data.length - 20} more</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function BestSellersCard({ data, loading, onExport }) {
  if (loading) {
    return <div className="rounded-[16px] border border-slate-200 bg-white p-4"><div className="h-4 w-28 bg-slate-100 rounded mb-4" />{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-slate-50 rounded mb-2" />)}</div>;
  }
  return (
    <Card padding={false} hover={false}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-rose-500" />
          <h4 className="text-sm font-bold text-slate-800">Best Sellers <span className="text-slate-400 font-normal">({data.length})</span></h4>
        </div>
        {data.length > 0 && <button onClick={onExport} className="text-slate-400 hover:text-primary transition-colors" title="Export CSV"><Download size={14} /></button>}
      </div>
      <div className="overflow-auto max-h-72">
        {data.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No sales data yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-400 uppercase"><th className="text-left px-4 py-2 font-semibold">#</th><th className="text-left px-4 py-2 font-semibold">Product</th><th className="text-right px-4 py-2 font-semibold">Sold</th><th className="text-right px-4 py-2 font-semibold">Revenue</th></tr></thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-semibold">{i + 1}</td>
                  <td className="px-4 py-2.5 text-slate-700 truncate max-w-[160px]">{p.name || "Untitled"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{p.totalSold ?? p.salesCount ?? p.sales ?? 0}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency((p.totalSold ?? p.salesCount ?? p.sales ?? 0) * (p.price ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function NewProductsCard({ data, loading, onExport }) {
  if (loading) {
    return <div className="rounded-[16px] border border-slate-200 bg-white p-4"><div className="h-4 w-28 bg-slate-100 rounded mb-4" />{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-slate-50 rounded mb-2" />)}</div>;
  }
  return (
    <Card padding={false} hover={false}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" />
          <h4 className="text-sm font-bold text-slate-800">New Products (30 days) <span className="text-slate-400 font-normal">({data.length})</span></h4>
        </div>
        {data.length > 0 && <button onClick={onExport} className="text-slate-400 hover:text-primary transition-colors" title="Export CSV"><Download size={14} /></button>}
      </div>
      <div className="overflow-auto max-h-72">
        {data.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No new products in the last 30 days</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-400 uppercase"><th className="text-left px-4 py-2 font-semibold">Product</th><th className="text-left px-4 py-2 font-semibold">SKU</th><th className="text-right px-4 py-2 font-semibold">Price</th><th className="text-right px-4 py-2 font-semibold">Created</th></tr></thead>
            <tbody>
              {data.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-700 truncate max-w-[140px]">{p.name || "Untitled"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{p.sku || "—"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{p.price != null ? formatCurrency(p.price) : "—"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {data.length > 20 && <tr><td colSpan={4} className="px-4 py-2 text-center text-xs text-slate-400">…and {data.length - 20} more</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
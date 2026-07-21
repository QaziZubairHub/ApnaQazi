import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, PackageX, Boxes, DollarSign, TrendingUpDown, RefreshCw, Download } from "lucide-react";
import { formatCurrency } from "../../../util/helpers";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  getOverstockProducts,
  getInventoryValue,
  getInventoryMovementSummary,
} from "../../../services/reportService";
import Card from "../../../components/ui/Card";

export function InventoryReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [overstock, setOverstock] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [movement, setMovement] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [low, out, over, value, mov] = await Promise.all([
        getLowStockProducts(),
        getOutOfStockProducts(),
        getOverstockProducts(100),
        getInventoryValue(),
        getInventoryMovementSummary(),
      ]);
      setLowStock(low);
      setOutOfStock(out);
      setOverstock(over);
      setInventoryValue(value);
      setMovement(mov);
    } catch (err) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = (data, name) => {
    if (!data.length) return;
    const header = "Name,SKU,Stock\n";
    const rows = data.map((p) => `${p.name || "Untitled"},${p.sku || ""},${p.stockQuantity ?? 0}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load inventory data</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button onClick={load} className="mt-3 px-4 py-2 rounded-[12px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Retry</button>
      </div>
    );
  }

  const summaryCards = [
    { label: "Inventory Value", value: formatCurrency(inventoryValue), icon: DollarSign, color: "from-blue-500 to-cyan-600" },
    { label: "Low Stock Items", value: lowStock.length, icon: AlertTriangle, color: "from-orange-500 to-red-600" },
    { label: "Out of Stock", value: outOfStock.length, icon: PackageX, color: "from-red-500 to-rose-600" },
    { label: "Overstock (>100)", value: overstock.length, icon: Boxes, color: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Inventory Report</h3>
          <p className="text-xs text-slate-500 mt-0.5">Stock levels, value, and movement</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-slate-200/80 bg-white p-5">
              <div className="h-10 w-10 rounded-[12px] bg-slate-100 mb-3" />
              <div className="h-4 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-8 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${c.color} text-white shadow-lg`}>
                  <c.icon size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {movement && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpDown size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-slate-800">Inventory Movement Summary</h4>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div><p className="text-xs text-slate-500">Stock In</p><p className="text-lg font-bold text-emerald-600">{movement.totalIn}</p></div>
            <div><p className="text-xs text-slate-500">Stock Out</p><p className="text-lg font-bold text-red-600">{movement.totalOut}</p></div>
            <div><p className="text-xs text-slate-500">Net Movement</p><p className={`text-lg font-bold ${movement.netMovement >= 0 ? "text-emerald-600" : "text-red-600"}`}>{movement.netMovement >= 0 ? "+" : ""}{movement.netMovement}</p></div>
            <div><p className="text-xs text-slate-500">Adjustments</p><p className="text-lg font-bold text-slate-700">{movement.adjustments}</p></div>
          </div>
          {movement.logCount > 0 && <p className="text-xs text-slate-400 mt-3">Based on {movement.logCount} inventory log entries</p>}
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <ReportTable title="Low Stock" data={lowStock} emptyMsg="No low stock products" icon={AlertTriangle} color="text-amber-600" onExport={() => exportCSV(lowStock, "low-stock")} />
        <ReportTable title="Out of Stock" data={outOfStock} emptyMsg="All products in stock" icon={PackageX} color="text-red-600" onExport={() => exportCSV(outOfStock, "out-of-stock")} />
        <ReportTable title="Overstock" data={overstock} emptyMsg="No overstock products" icon={Boxes} color="text-violet-600" onExport={() => exportCSV(overstock, "overstock")} />
      </div>
    </div>
  );
}

function ReportTable({ title, data, emptyMsg, icon: Icon, color, onExport }) {
  return (
    <Card padding={false} hover={false}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <h4 className="text-sm font-bold text-slate-800">{title} <span className="text-slate-400 font-normal">({data.length})</span></h4>
        </div>
        {data.length > 0 && (
          <button onClick={onExport} className="text-slate-400 hover:text-primary transition-colors" title="Export CSV">
            <Download size={14} />
          </button>
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
                  <td className={`px-4 py-2.5 text-right font-semibold ${Number(p.stockQuantity ?? 0) <= 0 ? "text-red-600" : Number(p.stockQuantity ?? 0) <= 5 ? "text-amber-600" : "text-slate-700"}`}>
                    {p.stockQuantity ?? 0}
                  </td>
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
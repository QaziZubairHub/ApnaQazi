import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, Download, Trash2, Archive, Eye, EyeOff, Star, Copy, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { bulkUpdateProducts, bulkDeleteProducts, duplicateProduct } from "../../../services/firebase/products";
import { exportToCSV } from "../../utils/export";
import { importProductsFromCSV } from "../../utils/import";
import Card from "../../../components/ui/Card";

export function TableToolbar({ selectedIds, products, onRefresh, clearSelection }) {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const selectedCount = selectedIds.length;

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      toast.error("Select products first.");
      return;
    }

    try {
      switch (action) {
        case "publish":
          await bulkUpdateProducts(selectedIds, { status: "active" });
          toast.success(`Published ${selectedCount} products`);
          break;
        case "unpublish":
          await bulkUpdateProducts(selectedIds, { status: "draft" });
          toast.success(`Unpublished ${selectedCount} products`);
          break;
        case "archive":
          await bulkUpdateProducts(selectedIds, { status: "archived" });
          toast.success(`Archived ${selectedCount} products`);
          break;
        case "restore":
          await bulkUpdateProducts(selectedIds, { status: "active" });
          toast.success(`Restored ${selectedCount} products`);
          break;
        case "feature":
          await bulkUpdateProducts(selectedIds, { featured: true });
          toast.success(`Featured ${selectedCount} products`);
          break;
        case "unfeature":
          await bulkUpdateProducts(selectedIds, { featured: false });
          toast.success(`Unfeatured ${selectedCount} products`);
          break;
        case "delete":
          if (!confirm(`Delete ${selectedCount} products? This cannot be undone.`)) return;
          await bulkDeleteProducts(selectedIds);
          toast.success(`Deleted ${selectedCount} products`);
          break;
        case "duplicate":
          for (const id of selectedIds) {
            await duplicateProduct(id);
          }
          toast.success(`Duplicated ${selectedCount} products`);
          break;
        case "export":
          exportToCSV(selectedProducts, "selected-products-export.csv");
          toast.success(`Exported ${selectedCount} products`);
          break;
      }

      clearSelection();
      if (onRefresh) onRefresh();
    } catch {
      toast.error(`Bulk ${action} failed`);
    }
  };

  const handleExportAll = () => {
    setExporting(true);
    try {
      exportToCSV(products, "all-products-export.csv");
      toast.success(`Exported ${products.length} products`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importProductsFromCSV(file);
      toast.success(`Imported ${result.imported} products${result.duplicates ? ` (${result.duplicates} duplicates skipped)` : ""}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <Card padding={false} hover={false}>
          <div className="p-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{selectedCount}</span> selected
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => handleBulkAction("publish")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Eye size={13} /> Publish
              </button>
              <button
                onClick={() => handleBulkAction("unpublish")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <EyeOff size={13} /> Draft
              </button>
              <button
                onClick={() => handleBulkAction("archive")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <Archive size={13} /> Archive
              </button>
              <button
                onClick={() => handleBulkAction("feature")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-slate-100 text-amber-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <Star size={13} /> Feature
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  More <ChevronDown size={12} />
                </button>
                {showBulkMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBulkMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[12px] shadow-xl border border-slate-200 z-50 py-1">
                      <button onClick={() => { setShowBulkMenu(false); handleBulkAction("restore"); }} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Archive size={13} /> Restore
                      </button>
                      <button onClick={() => { setShowBulkMenu(false); handleBulkAction("unfeature"); }} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Star size={13} /> Unfeature
                      </button>
                      <button onClick={() => { setShowBulkMenu(false); handleBulkAction("duplicate"); }} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Copy size={13} /> Duplicate
                      </button>
                      <button onClick={() => { setShowBulkMenu(false); handleBulkAction("export"); }} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Download size={13} /> Export Selected
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button onClick={() => { setShowBulkMenu(false); handleBulkAction("delete"); }} className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/product/create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload size={16} /> {importing ? "Importing..." : "Import"}
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} disabled={importing} />
          </label>

          <button
            onClick={handleExportAll}
            disabled={exporting || products.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Download size={16} /> {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

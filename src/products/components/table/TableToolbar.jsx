import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, Download, Trash2, Archive, Eye, EyeOff, Star, Copy, ChevronDown, Tag, Boxes, DollarSign, X } from "lucide-react";
import toast from "react-hot-toast";
import { bulkUpdateProducts, bulkDeleteProducts, duplicateProduct } from "../../../services/firebase/products";
import { exportToCSV, exportToJSON, exportToExcel } from "../../utils/export";
import { parseProductsFromCSV, commitProducts } from "../../utils/import";
import Card from "../../../components/ui/Card";
import { logAuditEvent } from "../../../services/audit";
import { useAuth } from "../../../contexts/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useBrands } from "../../hooks/useBrands";
import { useCollections } from "../../hooks/useCollections";

export function TableToolbar({ selectedIds, products, allProducts = [], onRefresh, clearSelection }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [fieldTarget, setFieldTarget] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const { categories } = useCategories();
  const { brands } = useBrands();
  const { collections } = useCollections();
  const selectedCount = selectedIds.length;

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const openFieldMenu = (target) => {
    setFieldTarget(target);
    setFieldValue("");
    setShowFieldMenu(true);
    setShowBulkMenu(false);
  };

  const applyFieldUpdate = async () => {
    if (!fieldTarget || selectedIds.length === 0) return;
    try {
      let patch = {};
      if (fieldTarget === "category") patch = { categoryId: fieldValue };
      else if (fieldTarget === "brand") patch = { brandId: fieldValue };
      else if (fieldTarget === "collection") patch = { collectionId: fieldValue };
      else if (fieldTarget === "price") {
        const v = Number(fieldValue);
        if (Number.isNaN(v) || v < 0) { toast.error("Enter a valid price"); return; }
        patch = { price: v };
      } else if (fieldTarget === "inventory") {
        const v = Number(fieldValue);
        if (Number.isNaN(v) || v < 0) { toast.error("Enter a valid quantity"); return; }
        patch = { stockQuantity: v };
      }
      await bulkUpdateProducts(selectedIds, patch);
      const label = { category: "category", brand: "brand", collection: "collection", price: "price", inventory: "inventory" }[fieldTarget];
      toast.success(`Updated ${selectedCount} products' ${label}`);
      setShowFieldMenu(false);
      setFieldTarget(null);
      clearSelection();
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      toast.error("Select products first.");
      return;
    }

    try {
      const uid = user?.uid || "anonymous";
      switch (action) {
        case "publish":
          await bulkUpdateProducts(selectedIds, { status: "active" });
          logAuditEvent(uid, "bulk_publish", "products", null, { ids: selectedIds });
          toast.success(`Published ${selectedCount} products`);
          break;
        case "unpublish":
          await bulkUpdateProducts(selectedIds, { status: "draft" });
          logAuditEvent(uid, "bulk_unpublish", "products", null, { ids: selectedIds });
          toast.success(`Unpublished ${selectedCount} products`);
          break;
        case "archive":
          await bulkUpdateProducts(selectedIds, { status: "archived" });
          logAuditEvent(uid, "bulk_archive", "products", null, { ids: selectedIds });
          toast.success(`Archived ${selectedCount} products`);
          break;
        case "restore":
          await bulkUpdateProducts(selectedIds, { status: "active" });
          logAuditEvent(uid, "bulk_restore", "products", null, { ids: selectedIds });
          toast.success(`Restored ${selectedCount} products`);
          break;
        case "feature":
          await bulkUpdateProducts(selectedIds, { featured: true });
          logAuditEvent(uid, "bulk_feature", "products", null, { ids: selectedIds });
          toast.success(`Featured ${selectedCount} products`);
          break;
        case "unfeature":
          await bulkUpdateProducts(selectedIds, { featured: false });
          logAuditEvent(uid, "bulk_unfeature", "products", null, { ids: selectedIds });
          toast.success(`Unfeatured ${selectedCount} products`);
          break;
        case "delete":
          if (!confirm(`Delete ${selectedCount} products? This cannot be undone.`)) return;
          await bulkDeleteProducts(selectedIds);
          logAuditEvent(uid, "bulk_delete", "products", null, { ids: selectedIds });
          toast.success(`Deleted ${selectedCount} products`);
          break;
        case "duplicate":
          for (const id of selectedIds) {
            await duplicateProduct(id);
          }
          logAuditEvent(uid, "bulk_duplicate", "products", null, { ids: selectedIds });
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

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (scope, format) => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      const data = scope === "selected" ? selectedProducts : allProducts;
      if (!data?.length) {
        toast.error("Nothing to export");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const base = scope === "selected" ? `products-selected-${stamp}` : `products-${stamp}`;
      if (format === "json") exportToJSON(data, `${base}.json`);
      else if (format === "excel") await exportToExcel(data, `${base}.xlsx`);
      else exportToCSV(data, `${base}.csv`);
      toast.success(`Exported ${data.length} products (${format.toUpperCase()})`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const [importPreview, setImportPreview] = useState(null);
  const [importProgress, setImportProgress] = useState({ total: 0, current: 0 });

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const parsed = await parseProductsFromCSV(file);
      if (parsed.errors.length) {
        toast.error(parsed.errors[0]);
        setImporting(false);
        e.target.value = "";
        return;
      }
      if (!parsed.valid.length) {
        toast.error("No valid rows to import");
        setImporting(false);
        e.target.value = "";
        return;
      }
      setImportPreview({ parsed, file });
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    setImportProgress({ total: importPreview.parsed.valid.length, current: 0 });
    try {
      const result = await commitProducts(importPreview.parsed.valid, (p) => {
        setImportProgress(p);
      });
      toast.success(`Imported ${result.imported} products${importPreview.parsed.duplicates ? ` (${importPreview.parsed.duplicates} duplicate rows skipped)` : ""}`);
      setImportPreview(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      setImportProgress({ total: 0, current: 0 });
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
                      <button onClick={() => openFieldMenu("category")} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Tag size={13} /> Set Category
                      </button>
                      <button onClick={() => openFieldMenu("brand")} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Tag size={13} /> Set Brand
                      </button>
                      <button onClick={() => openFieldMenu("collection")} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Tag size={13} /> Set Collection
                      </button>
                      <button onClick={() => openFieldMenu("price")} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <DollarSign size={13} /> Update Price
                      </button>
                      <button onClick={() => openFieldMenu("inventory")} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Boxes size={13} /> Update Inventory
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

      {/* Field Update Panel */}
      {showFieldMenu && fieldTarget && (
        <Card padding={false} hover={false} className="mt-2">
          <div className="p-4 flex items-end gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {fieldTarget === "price" && "New Price"}
                {fieldTarget === "inventory" && "New Stock Quantity"}
                {fieldTarget === "category" && "Select Category"}
                {fieldTarget === "brand" && "Select Brand"}
                {fieldTarget === "collection" && "Select Collection"}
              </p>
              {(fieldTarget === "category" || fieldTarget === "brand" || fieldTarget === "collection") ? (
                <select
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                >
                  <option value="">— None —</option>
                  {(fieldTarget === "category" ? categories : fieldTarget === "brand" ? brands : collections).map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder={fieldTarget === "price" ? "0.00" : "0"}
                  className="w-40 px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
            <button
              onClick={applyFieldUpdate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Apply to {selectedCount}
            </button>
            <button
              onClick={() => { setShowFieldMenu(false); setFieldTarget(null); }}
              className="px-3 py-2 rounded-[12px] bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
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

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || (products.length === 0 && selectedIds.length === 0)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? "Exporting..." : "Export"}
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-[12px] shadow-xl border border-slate-200 z-50 py-1">
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Export Filtered</p>
                  {["csv", "excel", "json"].map((f) => (
                    <button key={f} onClick={() => handleExport("filtered", f)} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Download size={13} /> All ({f.toUpperCase()})
                    </button>
                  ))}
                  <div className="border-t border-slate-100 my-1" />
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Export Selected</p>
                  {["csv", "excel", "json"].map((f) => (
                    <button key={f} onClick={() => handleExport("selected", f)} disabled={selectedIds.length === 0} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Download size={13} /> Selected ({f.toUpperCase()})
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setImportPreview(null)}>
          <div
            className="bg-white rounded-[20px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Import Preview</h3>
                <p className="text-sm text-slate-500">
                  {importPreview.parsed.valid.length} valid · {importPreview.parsed.duplicates.length} duplicate rows · {importPreview.parsed.errors.length} errors
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {importPreview.parsed.errors.length > 0 && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600 max-h-32 overflow-auto">
                {importPreview.parsed.errors.slice(0, 10).map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
                {importPreview.parsed.errors.length > 10 && <p>…and {importPreview.parsed.errors.length - 10} more</p>}
              </div>
            )}

            <div className="flex-1 overflow-auto px-6 py-3">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2 font-semibold">Name</th>
                    <th className="text-left py-2 font-semibold">SKU</th>
                    <th className="text-right py-2 font-semibold">Price</th>
                    <th className="text-right py-2 font-semibold">Stock</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.parsed.valid.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 text-slate-700 truncate max-w-[180px]">{p.name}</td>
                      <td className="py-2 text-slate-500">{p.sku}</td>
                      <td className="py-2 text-right text-slate-700">{p.price}</td>
                      <td className="py-2 text-right text-slate-700">{p.stockQuantity}</td>
                      <td className="py-2 text-slate-500">{p.status}</td>
                    </tr>
                  ))}
                  {importPreview.parsed.valid.length > 50 && (
                    <tr><td colSpan={5} className="py-2 text-center text-slate-400 text-xs">…and {importPreview.parsed.valid.length - 50} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {importing && importProgress.total > 0 && (
              <div className="px-6 py-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Importing {importProgress.current} of {importProgress.total}...</span>
                  <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-4 py-2 rounded-[12px] bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Upload size={16} /> {importing ? "Importing..." : `Import ${importPreview.parsed.valid.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

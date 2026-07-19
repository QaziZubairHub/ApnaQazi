import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, Copy, Archive, Trash2, Package, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "../../../util/helpers";
import Badge from "../../../components/ui/Badge";
import { bulkDeleteProducts, duplicateProduct, updateProduct } from "../../../services/firebase/products";

const COLUMNS = [
  { key: "name", label: "Product", width: 240, minWidth: 160, sortable: true },
  { key: "sku", label: "SKU", width: 130, minWidth: 100, sortable: true },
  { key: "category", label: "Category", width: 140, minWidth: 100, sortable: false },
  { key: "brand", label: "Brand", width: 130, minWidth: 100, sortable: false },
  { key: "price", label: "Price", width: 110, minWidth: 90, sortable: true, align: "right" },
  { key: "stock", label: "Stock", width: 100, minWidth: 80, sortable: true, align: "right" },
  { key: "status", label: "Status", width: 110, minWidth: 90, sortable: true },
  { key: "featured", label: "Featured", width: 100, minWidth: 80, sortable: false },
  { key: "updatedAt", label: "Updated", width: 130, minWidth: 100, sortable: true },
  { key: "actions", label: "", width: 180, minWidth: 160, sortable: false, fixed: "right" },
];

const SkeletonRow = () => (
  <tr className="border-b border-slate-50">
    <td className="px-3 py-3 sticky left-0 bg-white z-10"><div className="h-4 w-4 rounded bg-slate-100" /></td>
    {COLUMNS.map((col) => (
      <td key={col.key} className="px-3 py-3" style={{ width: col.width }}>
        <div className="h-4 rounded bg-slate-100" style={{ width: col.key === "name" ? "70%" : col.key === "actions" ? "60%" : "50%" }} />
      </td>
    ))}
  </tr>
);

export function ProductsTable({
  products,
  loading,
  error,
  selectedIds,
  allSelected,
  someSelected,
  toggleOne,
  toggleAll,
  sortBy,
  sortDir,
  onSort,
  onRefresh,
  page = 0,
  totalPages = 1,
  pageSize = 25,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const navigate = useNavigate();
  const [density, setDensity] = useState("normal");
  const [columnWidths, setColumnWidths] = useState(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.width]))
  );
  const resizingRef = useRef(null);
  const tableRef = useRef(null);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);

  const densityClass = density === "compact" ? "py-2 text-xs" : density === "comfortable" ? "py-4" : "py-3";

  const handleSort = (key) => {
    if (key === "actions" || key === "category" || key === "brand" || key === "featured") return;
    onSort(key);
  };

  const startResize = useCallback((e, colKey) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey];
    resizingRef.current = { colKey, startX, startWidth };

    const onMove = (ev) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const col = COLUMNS.find((c) => c.key === resizingRef.current.colKey);
      const newWidth = Math.max(col.minWidth, resizingRef.current.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [columnWidths]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveRowIndex((i) => Math.min(products.length - 1, i < 0 ? 0 : i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveRowIndex((i) => Math.max(0, i - 1));
      } else if (e.key === " " && activeRowIndex >= 0 && products[activeRowIndex]) {
        e.preventDefault();
        toggleOne(products[activeRowIndex].id);
      } else if (e.key === "Enter" && activeRowIndex >= 0 && products[activeRowIndex]) {
        e.preventDefault();
        navigate(`/admin/product/${products[activeRowIndex].id}/edit`);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [products, activeRowIndex, navigate, toggleOne]);

  const handleDuplicate = async (id, name) => {
    try {
      await duplicateProduct(id);
      toast.success(`Duplicated "${name}"`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleArchive = async (id, name) => {
    try {
      await updateProduct(id, { status: "archived" });
      toast.success(`Archived "${name}"`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Archive failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await bulkDeleteProducts([id]);
      toast.success(`Deleted "${name}"`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return null;
    return <ArrowUpDown size={12} className={`inline ml-1 ${sortDir === "asc" ? "rotate-180" : ""}`} />;
  };

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load products</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button onClick={onRefresh} className="mt-3 px-4 py-2 rounded-[12px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDensity("compact")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${density === "compact" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            Compact
          </button>
          <button
            onClick={() => setDensity("normal")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${density === "normal" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            Normal
          </button>
          <button
            onClick={() => setDensity("comfortable")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${density === "comfortable" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            Comfortable
          </button>
        </div>
        <p className="text-xs text-slate-400">Use arrow keys to navigate, Space to select, Enter to edit</p>
      </div>

      <div
        ref={tableRef}
        tabIndex={0}
        className="rounded-[16px] border border-slate-200 bg-white overflow-hidden outline-none focus:ring-2 focus:ring-primary/30"
      >
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="sticky top-0 z-20 bg-slate-50/80 px-3 py-3 w-10 border-b border-slate-100">
                   <input
                     type="checkbox"
                     checked={allSelected}
                     ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                     onChange={toggleAll}
                     disabled={products.length === 0}
                     className="accent-primary"
                     aria-label="Select all"
                   />
                </th>
                {COLUMNS.map((col) => {
                  const isLast = col.key === "actions";
                  return (
                    <th
                      key={col.key}
                      className={`sticky top-0 z-20 bg-slate-50/80 px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${
                        col.sortable ? "cursor-pointer select-none hover:text-slate-800" : ""
                      } ${col.align === "right" ? "text-right" : "text-left"}`}
                      style={{
                        width: columnWidths[col.key],
                        minWidth: col.minWidth,
                        position: "relative",
                      }}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortIndicator(col.key)}

                      {!isLast && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group"
                          onMouseDown={(e) => startResize(e, col.key)}
                        >
                          <div className="w-0.5 h-full mx-auto bg-transparent group-hover:bg-primary/50 transition-colors" />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-[16px] bg-slate-100 flex items-center justify-center mb-3">
                        <Package size={24} className="text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-600">No products found</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">
                        Try adjusting your search or filters, or create a new product.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
                  const lowT = Number(p.lowStockThreshold ?? p.stock?.lowStockThreshold ?? 5);
                  const featured = !!p.featured;
                  const isActive = idx === activeRowIndex;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`border-b border-slate-50 transition-colors ${
                        isActive ? "bg-primary/5" : "hover:bg-slate-50/60"
                      } ${selectedIds.includes(p.id) ? "bg-primary/[0.03]" : ""}`}
                    >
                      <td className={`sticky left-0 z-10 px-3 ${densityClass} ${isActive ? "bg-primary/5" : selectedIds.includes(p.id) ? "bg-primary/[0.03]" : "bg-white"}`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="accent-primary"
                          aria-label={`Select ${p.name || p.id}`}
                        />
                      </td>
                      <td className={`px-3 ${densityClass}`} style={{ width: columnWidths.name }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] bg-slate-100 overflow-hidden shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package size={14} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                              {p.name || p.title || "Untitled"}
                            </div>
                            {p.slug && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">/{p.slug}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 ${densityClass} text-xs text-slate-600`} style={{ width: columnWidths.sku }}>{p.sku || "—"}</td>
                      <td className={`px-3 ${densityClass} text-xs text-slate-600`} style={{ width: columnWidths.category }}>
                        {p.categoryName || p.categoryId || "—"}
                      </td>
                      <td className={`px-3 ${densityClass} text-xs text-slate-600`} style={{ width: columnWidths.brand }}>
                        {p.brandName || p.brandId || "—"}
                      </td>
                      <td className={`px-3 ${densityClass} text-xs font-semibold text-slate-800 text-right`} style={{ width: columnWidths.price }}>
                        {p.price != null ? formatCurrency(p.price) : "—"}
                      </td>
                      <td className={`px-3 ${densityClass} text-xs text-right`} style={{ width: columnWidths.stock }}>
                        <span className={`font-semibold ${
                          qty <= 0 ? "text-red-600" : qty <= lowT ? "text-amber-600" : "text-slate-700"
                        }`}>
                          {qty}
                        </span>
                      </td>
                      <td className={`px-3 ${densityClass}`} style={{ width: columnWidths.status }}>
                        <Badge status={p.status || "draft"} size="sm" />
                      </td>
                      <td className={`px-3 ${densityClass} text-xs`} style={{ width: columnWidths.featured }}>
                        {featured ? (
                          <span className="text-amber-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className={`px-3 ${densityClass} text-xs text-slate-500`} style={{ width: columnWidths.updatedAt }}>
                        {formatDate(p.updatedAt)}
                      </td>
                      <td className={`px-3 ${densityClass}`} style={{ width: columnWidths.actions }}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/admin/product/${p.id}/edit`)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/product/${p.id}/edit`)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id, p.name)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Archive"
                          >
                            <Archive size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 px-1 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {totalCount === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="ml-2 px-2 py-1 rounded-[8px] border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(0)}
              disabled={page === 0}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              « First
            </button>
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 0}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹ Prev
            </button>
            <span className="px-3 text-xs font-medium text-slate-600">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next ›
            </button>
            <button
              onClick={() => onPageChange?.(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Last »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

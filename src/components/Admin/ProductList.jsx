import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Trash2,
  Archive,
  Pencil,
  Eye,
  Copy,
} from "lucide-react";

import { db } from "../../firebase";
import { parseDateValue } from "../../util/helpers";
import { duplicateProduct, bulkUpdateProducts } from "../../services/firebase/products";

import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";


import { deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import toast from "react-hot-toast";

const PAGE_SIZES = [10, 25, 50];

const statusOrder = ["draft", "active", "archived"]; // for sorting

const ProductList = () => {
  const navigate = useNavigate();

  // Table state
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [collectionId, setCollectionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Lightweight local filters (options are fetched in module hooks; here we keep only IDs to not touch other modules)
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [collectionOptions, setCollectionOptions] = useState([]);

  // Enhanced UI state (sticky/keyboard/bulk-edit) layered on the existing module
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditPatch, setBulkEditPatch] = useState({ status: "", featured: "", categoryId: "", brandId: "" });
  const tableWrapRef = useRef(null);

  // Keyboard navigation: only active when the table container is focused
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (document.activeElement !== el) return;
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
  }, [products, activeRowIndex, navigate]);

  useEffect(() => {
    let unsub = false;
    const loadMeta = async () => {
      try {
        const [cats, brands, colls] = await Promise.all([
          getDocs(query(collection(db, "categories"), orderBy("updatedAt", "desc"))),
          getDocs(query(collection(db, "brands"), orderBy("updatedAt", "desc"))),
          getDocs(query(collection(db, "collections"), orderBy("updatedAt", "desc"))),
        ]);
        if (unsub) return;
        setCategoryOptions(cats.docs.map((d) => ({ id: d.id, ...d.data() } )));
        setBrandOptions(brands.docs.map((d) => ({ id: d.id, ...d.data() } )));
        setCollectionOptions(colls.docs.map((d) => ({ id: d.id, ...d.data() } )));
      } catch {
        // ignore; list will still work
      }
    };
    loadMeta();
    return () => {
      unsub = true;
    };
  }, []);

  const activeFilters = useMemo(() => {
    return {
      search: search.trim(),
      categoryId,
      brandId,
      collectionId,
      status,
      stockStatus,
      featuredOnly,
      sortBy,
      sortDir,
    };
  }, [search, categoryId, brandId, collectionId, status, stockStatus, featuredOnly, sortBy, sortDir]);

  // Note: Firestore pagination with total count requires additional query; we keep a practical implementation:
  // - fetch page items
  // - fetch total count with separate query
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const base = query(collection(db, "products"));

        const constraints = [];
        // Firestore composite queries are limited; for a production-ready module you'd use indexed queries.
        // Here we filter in-memory after fetching a page-ish dataset based on the most selective fields.

        // Most selective: status/featured
        if (activeFilters.status !== "all") {
          constraints.push(where("status", "==", activeFilters.status));
        }
        if (activeFilters.featuredOnly) {
          constraints.push(where("featured", "==", true));
        }

        // Sorting
        let orderConstraint = orderBy(activeFilters.sortBy, activeFilters.sortDir);

        const q = query(base, ...constraints, orderConstraint);
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const filtered = all.filter((p) => {
          const q = activeFilters.search.toLowerCase();
          const matchesSearch = q
            ? [p.name, p.slug, p.sku].filter(Boolean).some((x) => String(x).toLowerCase().includes(q))
            : true;

          const matchesCat = activeFilters.categoryId === "all" ? true : p.categoryId === activeFilters.categoryId;
          const matchesBrand = activeFilters.brandId === "all" ? true : p.brandId === activeFilters.brandId;
          const matchesColl = activeFilters.collectionId === "all" ? true : p.collectionId === activeFilters.collectionId;

          const matchesStatus = activeFilters.status === "all" ? true : p.status === activeFilters.status;

          // Stock derived from inventory doc reference if present
          let qty = p.stockQuantity;
          if (qty === undefined && p.inventoryId) {
            // best-effort: treat missing inventory snapshot as unknown => show
            qty = null;
          }

          const matchesStock = activeFilters.stockStatus === "all"
            ? true
            : activeFilters.stockStatus === "out"
              ? qty !== null && Number(qty) <= 0
              : activeFilters.stockStatus === "low"
                ? qty !== null && Number(qty) > 0 && Number(qty) <= Number(p.lowStockThreshold || 5)
                : activeFilters.stockStatus === "in"
                  ? qty !== null && Number(qty) > 0
                  : true;

          return matchesSearch && matchesCat && matchesBrand && matchesColl && matchesStatus && matchesStock;
        });

        const sorted = [...filtered].sort((a, b) => {
          const dir = activeFilters.sortDir === "asc" ? 1 : -1;
          if (activeFilters.sortBy === "status") {
            return (statusOrder.indexOf(a.status || "draft") - statusOrder.indexOf(b.status || "draft")) * dir;
          }
          const av = a[activeFilters.sortBy];
          const bv = b[activeFilters.sortBy];
          return (parseDateValue(bv)?.getTime?.() || bv || 0) > (parseDateValue(av)?.getTime?.() || av || 0) ? dir : -dir;
        });

        setTotalCount(sorted.length);
        const start = page * pageSize;
        setProducts(sorted.slice(start, start + pageSize));
        setSelectedIds((prev) => prev.filter((prevId) => sorted.slice(start, start + pageSize).some(({ id }) => id === prevId)));


      } catch {
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [

    activeFilters.search,
    activeFilters.categoryId,
    activeFilters.brandId,
    activeFilters.collectionId,
    activeFilters.status,
    activeFilters.stockStatus,
    activeFilters.featuredOnly,
    activeFilters.sortBy,
    activeFilters.sortDir,
    page,
    pageSize,
  ]);

  const allOnPageSelected = products.length > 0 && selectedIds.length === products.length;

  function toggleOne(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const toggleAll = () => {
    if (allOnPageSelected) setSelectedIds([]);
    else setSelectedIds(products.map((p) => p.id));
  };

  const handleBulkStatus = async (nextStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "products", id), { status: nextStatus, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
      toast.success(`Updated ${selectedIds.length} product(s).`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk update failed.");
    }
  };

  const handleBulkArchive = () => handleBulkStatus("archived");

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, "products", id))));
      toast.success(`Deleted ${selectedIds.length} product(s).`);
      setSelectedIds([]);
    } catch {
      toast.error("Delete failed.");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateProduct(id);
      toast.success("Product duplicated.");
    } catch {
      toast.error("Duplicate failed.");
    }
  };

  const handleBulkEditSave = async () => {
    if (selectedIds.length === 0) return;
    const patch = {};
    if (bulkEditPatch.status) patch.status = bulkEditPatch.status;
    if (bulkEditPatch.featured !== "") patch.featured = bulkEditPatch.featured === "true";
    if (bulkEditPatch.categoryId) patch.categoryId = bulkEditPatch.categoryId;
    if (bulkEditPatch.brandId) patch.brandId = bulkEditPatch.brandId;
    if (Object.keys(patch).length === 0) {
      setShowBulkEdit(false);
      return;
    }
    try {
      await bulkUpdateProducts(selectedIds, patch);
      toast.success(`Updated ${selectedIds.length} product(s).`);
      setSelectedIds([]);
      setShowBulkEdit(false);
      setBulkEditPatch({ status: "", featured: "", categoryId: "", brandId: "" });
    } catch {
      toast.error("Bulk update failed.");
    }
  };

  const handleSortClick = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryId("all");
    setBrandId("all");
    setCollectionId("all");
    setStatus("all");
    setStockStatus("all");
    setFeaturedOnly(false);
    setSortBy("updatedAt");
    setSortDir("desc");
    setPage(0);
  };

  const fmtDate = (v) => {
    const d = parseDateValue(v);
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Catalog</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog, inventory, and SEO.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate("/admin/product/create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-white text-sm font-semibold shadow-md shadow-primary/15 hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Create Product
          </button>

          <button
            onClick={() => toast("Import is not implemented yet in this scaffold.")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <Upload size={16} /> Import
          </button>

          <button
            onClick={() => {
              // best-effort export based on current page (production would export all / filtered)
              const rows = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stockQuantity, status: p.status, updatedAt: fmtDate(p.updatedAt) }));
              const header = Object.keys(rows[0] || { id: "" }).join(",");
              const body = rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
              const csv = `${header}\n${body}`;
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "products.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </div>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search products by name, slug, SKU"
              className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={brandId}
              onChange={(e) => { setBrandId(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            >
              <option value="all">All Brands</option>
              {brandOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={collectionId}
              onChange={(e) => { setCollectionId(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            >
              <option value="all">All Collections</option>
              {collectionOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={stockStatus}
              onChange={(e) => { setStockStatus(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            >
              <option value="all">All Stock</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => { setFeaturedOnly(e.target.checked); setPage(0); }}
              />
              Featured only
            </label>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              <SlidersHorizontal size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-3 rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{selectedIds.length}</span> selected
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkStatus("active")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkStatus("draft")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Draft
              </button>
              <button
                onClick={handleBulkArchive}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Archive size={16} /> Archive
              </button>
              <button
                onClick={() => setShowBulkEdit(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Pencil size={16} /> Bulk Edit
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <CardTable
        loading={loading}
        products={products}
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        activeRowIndex={activeRowIndex}
        tableWrapRef={tableWrapRef}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onSort={handleSortClick}
        sortBy={sortBy}
        sortDir={sortDir}
        onView={(id) => navigate(`/admin/product/${id}/edit`)}
        onEdit={(_id) => {}}
        onDuplicate={handleDuplicate}
        onArchive={(id) => updateDoc(doc(db, "products", id), { status: "archived", updatedAt: new Date().toISOString() }).then(() => toast.success("Archived."))}
        onDelete={(id) => deleteDoc(doc(db, "products", id)).then(() => toast.success("Deleted."))}
      />

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowBulkEdit(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Edit ({selectedIds.length})</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={bulkEditPatch.status} onChange={(e) => setBulkEditPatch((p) => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="">No change</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Featured</label>
                <select value={bulkEditPatch.featured} onChange={(e) => setBulkEditPatch((p) => ({ ...p, featured: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="">No change</option>
                  <option value="true">Featured</option>
                  <option value="false">Not featured</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={bulkEditPatch.categoryId} onChange={(e) => setBulkEditPatch((p) => ({ ...p, categoryId: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="">No change</option>
                    {categoryOptions.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <select value={bulkEditPatch.brandId} onChange={(e) => setBulkEditPatch((p) => ({ ...p, brandId: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="">No change</option>
                    {brandOptions.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowBulkEdit(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={handleBulkEditSave} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="rounded-[10px] border border-slate-200 bg-white px-2 py-2 text-xs"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {"<"}
          </button>
          <span className="text-xs text-slate-600">
            Page <span className="font-semibold text-slate-900">{page + 1}</span> of <span className="font-semibold text-slate-900">{Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CardTable = ({
  loading,
  products,
  selectedIds,
  allOnPageSelected,
  tableWrapRef,
  onToggleAll,
  onToggleOne,
  onSort,
  sortBy,
  sortDir,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}) => {
  const sortIndicator = (key) => (sortBy === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  return (
    <div
      ref={tableWrapRef}
      tabIndex={0}
      className="rounded-[16px] border border-slate-200 bg-white overflow-hidden outline-none focus:ring-2 focus:ring-primary/30 max-h-[70vh]"
    >
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="px-4 py-3 w-10">
                <button onClick={onToggleAll} className="text-slate-400 hover:text-primary transition-colors">
                  <input type="checkbox" checked={allOnPageSelected} readOnly className="accent-primary" />
                </button>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => onSort("name")}>Name{sortIndicator("name")}</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => onSort("status")}>Status{sortIndicator("status")}</th>
              <th className="px-4 py-3 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <div className="h-4 w-4 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-slate-100" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-slate-100" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => onToggleOne(p.id)}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 truncate max-w-[220px]">{p.name || p.title || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[180px]">{p.slug || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-white">
                      {p.status || "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => onView(p.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => onEdit(p.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDuplicate(p.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => onArchive(p.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <Archive size={14} />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;


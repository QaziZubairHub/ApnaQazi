import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Archive,
  Copy,
  Eye,
  Pencil,
  Image as ImageIcon,
  RefreshCw,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Box,
  CheckCircle2,
  Star,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../ui/Card";
import StatCard from "../ui/StatCard";
import { StatCardSkeleton } from "../ui/Skeleton";
import Badge from "../ui/Badge";

import EmptyState from "../ui/EmptyState";

import {
  formatCurrency,
  parseDateValue,
  genSlug,
  parseNumber,
} from "../../util/helpers";

import {
  bulkDeleteProducts,
  bulkUpdateProducts,
  fetchProductsPage,
  subscribeCollections,
  subscribeDistinctProductStatuses,
  subscribeDistinctStockStatuses,
} from "../../services/firebase/products";



import { computeInventoryValue, getStockStatus } from "./ProductDashboardHelpers";

const PAGE_SIZES = [10, 25, 50];

const toDisplayDate = (v) => {
  const d = parseDateValue(v);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const calcDiscountedPrice = (price, discount) => {
  const p = Number(price ?? 0);
  const disc = Number(discount ?? 0);
  if (!disc) return p;
  return Math.round(p - (p * disc) / 100);
};

const csvEscape = (v) => {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadTextFile = (filename, content, mime = "text/plain") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Products = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    featuredProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    inventoryValue: 0,
  });

  // Table
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cursorStack, setCursorStack] = useState([]); // store cursors for back
  const [cursor, setCursor] = useState(null);
  const [pageItems, setPageItems] = useState([]);
  const [page, setPage] = useState(0);

  // Search
  const [searchText, setSearchText] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    categoryId: "all",
    brandId: "all",
    collectionId: "all",
    status: "all", // draft|active|archived|all
    stock: "all", // in|low|out|all
    featured: false,
    priceMin: "",
    priceMax: "",
    dateCreatedFrom: "",
    dateCreatedTo: "",
  });

  // Options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);

  const [productStatuses, setProductStatuses] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);

  const [optionsLoading, setOptionsLoading] = useState(false);




  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Import state - ref is not used to avoid breaking constraints

  const activeFiltersCount = useMemo(() => {
    const f = filters;
    let n = 0;
    if (f.categoryId !== "all") n++;
    if (f.brandId !== "all") n++;
    if (f.collectionId !== "all") n++;
    if (f.status !== "all") n++;
    if (f.stock !== "all") n++;
    if (f.featured) n++;
    if (f.priceMin) n++;
    if (f.priceMax) n++;
    if (f.dateCreatedFrom) n++;
    if (f.dateCreatedTo) n++;
    if (searchText.trim()) n++;
    return n;
  }, [filters, searchText]);

  const resetFilters = () => {
    setSearchText("");
    setFilters({
      categoryId: "all",
      brandId: "all",
      collectionId: "all",
      status: "all",
      stock: "all",
      featured: false,
      priceMin: "",
      priceMax: "",
      dateCreatedFrom: "",
      dateCreatedTo: "",
    });
    setCursorStack([]);
    setCursor(null);
    setPage(0);
    setSelectedIds([]);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setOptionsLoading(true);

        // Real-time listeners for dropdown options
        const unsubCats = subscribeCollections(
          "categories",
          (items) => {
            if (cancelled) return;
            // Best-effort: use `name` field; fallback to `title`.
            const normalized = items
              .map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id }))
              .filter((x) => x.name);
            setCategories(normalized);
          }
        );

        const unsubBrands = subscribeCollections(
          "brands",
          (items) => {
            if (cancelled) return;
            const normalized = items
              .map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id }))
              .filter((x) => x.name);
            setBrands(normalized);
          }
        );

        const unsubColls = subscribeCollections(
          "collections",
          (items) => {
            if (cancelled) return;
            const normalized = items
              .map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id }))
              .filter((x) => x.name);
            setCollections(normalized);
            setOptionsLoading(false);
          }
        );

        const unsubStatuses = subscribeDistinctProductStatuses(
          (statuses) => {
            if (cancelled) return;
            setProductStatuses(statuses);
          }
        );

        const unsubStock = subscribeDistinctStockStatuses((buckets) => {
          if (cancelled) return;
          setStockStatuses(buckets);
        });

        return () => {
          unsubCats?.();
          unsubBrands?.();
          unsubColls?.();
          unsubStatuses?.();
          unsubStock?.();
        };

      } catch {
        if (cancelled) return;
        setOptionsLoading(false);
      }
    };

    let cleanup = null;
    run().then((c) => {
      cleanup = c;
    });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);


  // Enterprise stats (single snapshot to reduce reads). Production: use aggregate counters.
  useEffect(() => {
    let unsub = null;
    let cancelled = false;
    const run = async () => {
      // best-effort: compute from page-like query by fetching all (small/medium catalogs)
      // Firestore aggregate best practice: maintain counters. This module works without it.
      try {
        const { subscribeProducts } = await import("../../services/firebase/products");
        unsub = subscribeProducts((items) => {
          if (cancelled) return;
          let totalProducts = items.length;
          let activeProducts = 0;
          let draftProducts = 0;
          let featuredProducts = 0;
          let outOfStock = 0;
          let lowStock = 0;
          let inventoryValue = 0;

          for (const p of items) {
            const status = p.status || "draft";
            if (status === "active") activeProducts++;
            if (status === "draft") draftProducts++;
            if (p.featured) featuredProducts++;

            const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
            const lowT = Number(p.lowStockThreshold ?? p.stock?.lowStockThreshold ?? 5);
            if (qty <= 0) outOfStock++;
            if (qty > 0 && qty <= lowT) lowStock++;

            const sellingPrice = Number(p.price ?? 0);
            inventoryValue += computeInventoryValue(sellingPrice, qty);
          }

          setStats({
            totalProducts,
            activeProducts,
            draftProducts,
            featuredProducts,
            outOfStock,
            lowStock,
            inventoryValue,
          });
        });
      } catch {
        // stats will remain zeros
      }
    };
    run();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const dateFrom = filters.dateCreatedFrom
          ? parseDateValue(filters.dateCreatedFrom)
          : null;
        const dateTo = filters.dateCreatedTo ? parseDateValue(filters.dateCreatedTo) : null;

        const { items } = await fetchProductsPage({
          pageSize: rowsPerPage,
          cursor,
          orderField: "createdAt",
          orderDir: "desc",
          filters: {
            searchText,
            categoryId: filters.categoryId,
            brandId: filters.brandId,
            collectionId: filters.collectionId,
            status: filters.status,
            featured: filters.featured,
            stock: filters.stock,
            priceMin: filters.priceMin ? Number(filters.priceMin) : null,
            priceMax: filters.priceMax ? Number(filters.priceMax) : null,
            dateFrom,
            dateTo,
          },
        });

        if (cancelled) return;
        setPageItems(items);
        // nextCursor is handled when pressing next; we recompute each time for simplicity.
      } catch {
        if (cancelled) return;
        setPageItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [rowsPerPage, cursor, page, searchText, filters]);

  useEffect(() => {
    // keep selection only for current page when navigating pages
    setSelectedIds((prev) => prev.filter((id) => pageItems.some((p) => p.id === id)));
  }, [pageItems]);

  const allOnPageSelected = pageItems.length > 0 && selectedIds.length === pageItems.length;

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (allOnPageSelected) setSelectedIds([]);
    else setSelectedIds(pageItems.map((p) => p.id));
  };

  const requireSelection = () => {
    if (selectedIds.length === 0) {
      toast.error("Select products first.");
      return false;
    }
    return true;
  };

  const handleBulkPublish = async () => {
    if (!requireSelection()) return;
    try {
      await bulkUpdateProducts(selectedIds, { status: "active" });
      toast.success(`Published ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk publish failed.");
    }
  };

  const handleBulkDraft = async () => {
    if (!requireSelection()) return;
    try {
      await bulkUpdateProducts(selectedIds, { status: "draft" });
      toast.success(`Moved to draft: ${selectedIds.length}.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk draft failed.");
    }
  };

  const handleBulkArchive = async () => {
    if (!requireSelection()) return;
    try {
      await bulkUpdateProducts(selectedIds, { status: "archived" });
      toast.success(`Archived ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk archive failed.");
    }
  };

  const handleBulkFeature = async () => {
    if (!requireSelection()) return;
    try {
      await bulkUpdateProducts(selectedIds, { featured: true });
      toast.success(`Featured ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk feature failed.");
    }
  };

  const handleBulkExportSelected = async () => {
    if (!requireSelection()) return;
    const rows = pageItems.filter((p) => selectedIds.includes(p.id));
    const header = [
      "id",
      "name",
      "slug",
      "sku",
      "barcode",
      "categoryId",
      "brandId",
      "collectionId",
      "price",
      "costPrice",
      "discount",
      "stockQuantity",
      "status",
      "featured",
      "createdAt",
      "updatedAt",
    ];
    const body = rows
      .map((p) =>
        header
          .map((k) => {
            const v =
              k === "createdAt" || k === "updatedAt" ? toDisplayDate(p[k]) : p[k];
            return csvEscape(v);
          })
          .join(",")
      )
      .join("\n");

    const csv = `${header.join(",")}\n${body}`;
    downloadTextFile("products-export.csv", csv, "text/csv");
  };

  const handleBulkDelete = async () => {
    if (!requireSelection()) return;
    if (!confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    try {
      await bulkDeleteProducts(selectedIds);
      toast.success(`Deleted ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk delete failed.");
    }
  };

  const canPrev = page > 0;

  const handlePrev = () => {
    if (!canPrev) return;
    setCursorStack((prev) => prev.slice(0, -1));
    const nextPage = page - 1;
    setPage(nextPage);
    setCursor(cursorStack[cursorStack.length - 2] ?? null);
  };

  const handleNext = () => {
    // cursor-based pagination: keep a cursor stack; we recompute next cursor by fetching page again.
    // For production: store the actual nextCursor. Here we approximate by moving cursor to current last createdAt.
    if (pageItems.length < rowsPerPage) return;
    const last = pageItems[pageItems.length - 1];
    if (!last?.createdAt) return;
    setCursorStack((prev) => [...prev, cursor]);
    setCursor(last.createdAt);
    setPage((p) => p + 1);
    setSelectedIds([]);
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV has no rows");
      const header = lines[0].split(",").map((h) => h.trim());

      const required = ["name", "sku", "barcode", "price"];
      for (const r of required) {
        if (!header.includes(r)) throw new Error(`Missing required column: ${r}`);
      }

      const seen = new Set();
      const duplicates = [];
      const toUpsert = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = [];
        let cur = "";
        let inQ = false;
        for (const ch of lines[i]) {
          if (ch === '"') inQ = !inQ;
          if (ch === "," && !inQ) {
            cols.push(cur);
            cur = "";
          } else {
            cur += ch;
          }
        }
        cols.push(cur);

        const row = {};
        header.forEach((k, idx) => (row[k] = cols[idx]));
        const key = `${String(row.sku ?? "").trim()}|${String(row.barcode ?? "").trim()}`;
        if (seen.has(key)) {
          duplicates.push(i + 1);
          continue;
        }
        seen.add(key);

        toUpsert.push({
          name: String(row.name ?? "").trim(),
          sku: String(row.sku ?? "").trim(),
          barcode: String(row.barcode ?? "").trim(),
          price: parseNumber(row.price),
        });
      }

      if (duplicates.length) toast.error(`Duplicate rows detected: ${duplicates.slice(0, 5).join(", ")}${duplicates.length > 5 ? "…" : ""}`);

      // Upsert minimal fields: for full spec production you should use ProductUpsert logic.
      const { db } = await import("../../firebase");
      const { collection, doc, getDocs, query, where, writeBatch } = await import("firebase/firestore");

      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const p of toUpsert) {
        if (!p.name) continue;
        // find existing by sku or barcode in-memory by scanning in batch is expensive; best practice: unique fields/indexes.
        const q = query(collection(db, "products"), where("sku", "==", p.sku));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const ex = snap.docs[0];
          batch.update(doc(db, "products", ex.id), { name: p.name, sku: p.sku, barcode: p.barcode, price: p.price, updatedAt: now });
        } else {
          const ref = doc(collection(db, "products"));
          batch.set(ref, {
            name: p.name,
            slug: genSlug(p.name),
            sku: p.sku,
            barcode: p.barcode,
            price: p.price,
            status: "draft",
            featured: false,
            createdAt: now,
            updatedAt: now,
            stockQuantity: 0,
            lowStockThreshold: 5,
            trackInventory: true,
            allowBackorders: false,
          });
        }
      }

      await batch.commit();
      toast.success(`Imported ${toUpsert.length} products (draft).`);
    } catch (e) {
      toast.error(e?.message || "Import failed.");
    }
  };

  const handleExport = (format) => {
    // Export current filtered page.
    const rows = pageItems;
    const headers = [
      "id",
      "name",
      "slug",
      "sku",
      "barcode",
      "categoryId",
      "brandId",
      "collectionId",
      "price",
      "costPrice",
      "discount",
      "stockQuantity",
      "status",
      "featured",
      "createdAt",
      "updatedAt",
    ];

    if (format === "csv") {
      const body = rows
        .map((p) => headers.map((k) => csvEscape(k.includes("At") ? toDisplayDate(p[k]) : p[k])).join(","))
        .join("\n");
      downloadTextFile("products-export.csv", `${headers.join(",")}\n${body}`, "text/csv");
      return;
    }

    if (format === "excel" || format === "xlsx") {
      // simple: deliver CSV with .xls extension for Excel compatibility.
      const body = rows
        .map((p) => headers.map((k) => csvEscape(k.includes("At") ? toDisplayDate(p[k]) : p[k])).join(","))
        .join("\n");
      downloadTextFile("products-export.xls", `${headers.join(",")}\n${body}`, "application/vnd.ms-excel");
      return;
    }

    if (format === "pdf") {
      toast.error("PDF export requires a dedicated renderer; exporting CSV instead.");
      handleExport("csv");
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Catalog</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Enterprise product management dashboard</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/product/create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Create Product
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload size={16} /> Import
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls,.json,text/csv"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <Download size={16} /> Export
          </button>

          <button
            type="button"
            onClick={() => toast("Use the bulk actions bar below to apply actions to selected rows.")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <SlidersHorizontal size={16} /> Bulk Actions
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Products" value={stats.totalProducts} icon={Box} prefix="" />
            <StatCard title="Active Products" value={stats.activeProducts} icon={CheckCircle2} prefix="" />
            <StatCard title="Draft Products" value={stats.draftProducts} icon={Archive} prefix="" />
            <StatCard title="Featured Products" value={stats.featuredProducts} icon={Star} prefix="" />
          </>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i + 10} />)
        ) : (
          <>
            <StatCard title="Out Of Stock" value={stats.outOfStock} icon={Archive} prefix="" />
            <StatCard title="Low Stock" value={stats.lowStock} icon={AlertTriangle} prefix="" />
            <StatCard title="Inventory Value" value={stats.inventoryValue} prefix="Rs " icon={BarChart2} />
            <div />
          </>
        )}
      </div>

      {/* Search + Filters */}
      <Card padding={false} hover={false}>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 min-w-[260px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </div>
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCursorStack([]);
                  setCursor(null);
                  setPage(0);
                }}
                placeholder="Search by Product Name, SKU, Barcode, Brand, Category, Collection, Slug"
                className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <span className="text-xs text-slate-500">Filters: {activeFiltersCount}</span>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <RefreshCw size={16} /> Reset Filters
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              disabled={optionsLoading}
            >
              <option value="all">All Categories</option>
              {optionsLoading && <option value="all">Loading…</option>}
              {!optionsLoading && categories.length === 0 && <option value="all" disabled>No categories</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>


            <select
              value={filters.brandId}
              onChange={(e) => setFilters((p) => ({ ...p, brandId: e.target.value }))}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              disabled={optionsLoading}
            >
              <option value="all">All Brands</option>
              {optionsLoading && <option value="all">Loading…</option>}
              {!optionsLoading && brands.length === 0 && <option value="all" disabled>No brands</option>}
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>


            <select
              value={filters.collectionId}
              onChange={(e) => setFilters((p) => ({ ...p, collectionId: e.target.value }))}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              disabled={optionsLoading}
            >
              <option value="all">All Collections</option>
              {optionsLoading && <option value="all">Loading…</option>}
              {!optionsLoading && collections.length === 0 && <option value="all" disabled>No collections</option>}
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>


            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              disabled={optionsLoading}
            >
              <option value="all">All Status</option>
              {optionsLoading && <option value="all">Loading…</option>}
              {!optionsLoading && productStatuses.length === 0 && (
                <option value="all" disabled>No statuses</option>
              )}
              {productStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>


            <select
              value={filters.stock}
              onChange={(e) => setFilters((p) => ({ ...p, stock: e.target.value }))}
              className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              disabled={optionsLoading}
            >
              <option value="all">All Stock</option>
              {optionsLoading && <option value="all">Loading…</option>}
              {!optionsLoading && stockStatuses.length === 0 && (
                <option value="all" disabled>No stock</option>
              )}
              {stockStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>



            <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => setFilters((p) => ({ ...p, featured: e.target.checked }))}
                className="accent-primary"
              />
              Featured
            </label>

            <div className="flex items-center gap-2">
              <input
                value={filters.priceMin}
                onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
                placeholder="Min price"
                className="w-28 px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400"
                type="number"
              />
              <input
                value={filters.priceMax}
                onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                placeholder="Max price"
                className="w-28 px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400"
                type="number"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                value={filters.dateCreatedFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateCreatedFrom: e.target.value }))}
                type="date"
                className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />
              <input
                value={filters.dateCreatedTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateCreatedTo: e.target.value }))}
                type="date"
                className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <Card padding={false} hover={false}>
          <div className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{selectedIds.length}</span> selected
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkPublish}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={handleBulkDraft}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Draft
              </button>
              <button
                type="button"
                onClick={handleBulkArchive}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Archive size={16} /> Archive
              </button>
              <button
                type="button"
                onClick={handleBulkFeature}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Feature
              </button>
              <button
                type="button"
                onClick={handleBulkExportSelected}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Download size={16} /> Export Selected
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} /> Delete Selected
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding={false} hover={false}>
        {pageItems.length === 0 && !loading ? (
          <div className="p-10">
            <EmptyState
              title="No Products Found"
              description="Try adjusting your filters or import a new product catalog."
              icon={ImageIcon}
              actionButtons={
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/product/create")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={16} /> Create Product
                  </button>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer">
                    <Upload size={16} /> Import Products
                    <input
                      type="file"
                      accept=".csv,.txt,.xlsx,.xls,.json,text/csv"
                      className="hidden"
                      onChange={(e) => handleImport(e.target.files?.[0])}
                    />
                  </label>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-4 py-3 w-10">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        readOnly
                        className="accent-primary"
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Product Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Barcode</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Collection</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Selling Price</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Cost Price</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Stock Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Featured</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Visibility</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Created Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Updated Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-10 w-10 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    </tr>
                  ))
                ) : (
                  pageItems.map((p) => {
                    const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
                    const lowT = Number(p.lowStockThreshold ?? p.stock?.lowStockThreshold ?? 5);
                    const stockStatus = getStockStatus(qty, lowT);
                    const discounted = calcDiscountedPrice(p.price, p.discount);
                    const featured = !!p.featured;
                    const visibility = p.status === "active" ? "Published" : p.status === "draft" ? "Draft" : "Hidden";

                    const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
                    const brandName = brands.find((b) => b.id === p.brandId)?.name;
                    const collectionName = collections.find((c) => c.id === p.collectionId)?.name;

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleOne(p.id)}
                            className="accent-primary"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-[10px] bg-slate-100 overflow-hidden shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="min-w-[220px]">
                            <div className="text-sm font-semibold text-slate-800 truncate">{p.name || p.title || "—"}</div>
                            <div className="text-xs text-slate-500 truncate">{p.slug ? `/${p.slug}` : "—"}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-700">{p.sku || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">{p.barcode || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{categoryName || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{brandName || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{collectionName || "—"}</td>

                        <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{formatCurrency(discounted)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{formatCurrency(p.costPrice ?? 0)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.discount ? `${p.discount}%` : "—"}</td>

                        <td className="px-4 py-3 text-xs text-slate-700">{qty}</td>
                        <td className="px-4 py-3">
                          <Badge status={stockStatus === "in" ? "active" : stockStatus === "low" ? "warning" : "blocked"} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs">{featured ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{visibility}</td>
                        <td className="px-4 py-3">
                          <Badge status={p.status || "draft"} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{toDisplayDate(p.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{toDisplayDate(p.updatedAt)}</td>

                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/product/${p.id}/edit`)}
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/product/${p.id}/edit`)}
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toast.error("Duplicate requires full implementation in services.");
                              }}
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toast.error("Archive requires additional module routing.");
                              }}
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Archive size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm("Delete this product? This cannot be undone.")) return;
                                try {
                                  await bulkDeleteProducts([p.id]);
                                  toast.success("Product deleted.");
                                } catch {
                                  toast.error("Delete failed.");
                                }
                              }}
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-2">
                            Inventory/Images/SEO/History actions are managed via Edit page.
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCursorStack([]);
              setCursor(null);
              setPage(0);
              setSelectedIds([]);
            }}
            className="rounded-[10px] border border-slate-200 bg-white px-2 py-2 text-xs"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs text-slate-600">
            Page <span className="font-semibold text-slate-900">{page + 1}</span>
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={pageItems.length < rowsPerPage}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;


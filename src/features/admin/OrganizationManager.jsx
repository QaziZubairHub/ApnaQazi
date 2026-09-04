import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganizationItems } from "../products/hooks/useOrganizationItems";
import { OrganizationService } from "../../services/OrganizationService";
import { subscribeProducts } from "../../services/firebase/products";
import {
  Plus, Search, Trash2, Copy, Eye, Pencil,
  FolderOpen, Tags, Bookmark, Layers,
  ChevronLeft, ChevronRight, X, AlertTriangle,
  ArrowUpDown, MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import { QuickCreateModal } from "../products/components/ui/QuickCreateModal";

const PAGE_SIZE = 10;
const COLLECTIONS = ["categories", "brands", "collections"];

const COLLECTION_META = {
  categories: { label: "Categories", icon: Tags, singular: "Category" },
  brands: { label: "Brands", icon: Bookmark, singular: "Brand" },
  collections: { label: "Collections", icon: Layers, singular: "Collection" },
};

const STATUS_VARIANTS = {
  active: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  inactive: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  draft: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  archived: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
};

function StatusBadge({ status }) {
  const v = STATUS_VARIANTS[status] || STATUS_VARIANTS.archived;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Archived"}
    </span>
  );
}

function ActionMenu({ onView, onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0, openUp: false });

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const ddHeight = 210;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < ddHeight && rect.top - 8 > ddHeight;
      setPos({
        top: openUp ? rect.top - ddHeight : rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
        openUp,
      });
    }
    setOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 opacity-60 group-hover:opacity-100 hover:opacity-100 hover:text-slate-700 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-[220px] rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 py-1.5 px-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: pos.top, right: pos.right }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onView();
                handleClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:bg-slate-50"
              role="menuitem"
              aria-label="View"
            >
              <Eye size={15} className="text-slate-400" />
              <span>View</span>
            </button>
            <button
              onClick={() => {
                onEdit();
                handleClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:bg-slate-50"
              role="menuitem"
              aria-label="Edit"
            >
              <Pencil size={15} className="text-slate-400" />
              <span>Edit</span>
            </button>
            {onDuplicate ? (
              <button
                onClick={() => {
                  onDuplicate();
                  handleClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:bg-slate-50"
                role="menuitem"
                aria-label="Duplicate"
              >
                <Copy size={15} className="text-slate-400" />
                <span>Duplicate</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg cursor-not-allowed"
                role="menuitem"
                aria-label="Duplicate (coming soon)"
              >
                <Copy size={15} className="text-slate-300" />
                <span>Duplicate</span>
                <span className="ml-auto text-[10px] text-slate-300">Soon</span>
              </button>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                onDelete();
                handleClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus:bg-red-50"
              role="menuitem"
              aria-label="Delete"
            >
              <Trash2 size={15} className="text-red-500" />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: i === 1 ? "4rem" : i === 6 ? "5rem" : "70%" }} />
        </td>
      ))}
    </tr>
  );
}

export default function OrganizationManager() {
  const { user } = useAuth();
  const { collection: collectionParam } = useParams();
  const collectionName = collectionParam || "categories";
  const meta = COLLECTION_META[collectionName] || { label: "Items", icon: FolderOpen, singular: "Item" };
  const Icon = meta.icon;

  const { items, loading, error } = useOrganizationItems(collectionName);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsub = subscribeProducts((data) => {
      setProducts(data || []);
    });
    return unsub;
  }, []);

  const productCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      if (p.isDeleted) return;
      if (collectionName === "categories" && p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      } else if (collectionName === "brands" && p.brandId) {
        counts[p.brandId] = (counts[p.brandId] || 0) + 1;
      } else if (collectionName === "collections" && p.collectionId) {
        counts[p.collectionId] = (counts[p.collectionId] || 0) + 1;
      }
    });
    return counts;
  }, [products, collectionName]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [createOpen, setCreateOpen] = useState(false);

  const [viewItem, setViewItem] = useState(null);

  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sort icon using Lucide ArrowUpDown
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1.5 text-slate-300 inline" />;
    return (
      <ArrowUpDown
        size={12}
        className={`ml-1.5 inline transition-transform ${sortDir === "asc" ? "text-primary" : "text-primary rotate-180"}`}
      />
    );
  };

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      if (search && !(item.name || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [items, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = filteredItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const openView = useCallback((item) => {
    setViewItem(item);
  }, []);

  const openEdit = useCallback((item) => {
    setEditItem(item);
    setEditName(item.name || "");
    setEditSlug(item.slug || "");
    setEditStatus(item.status || "active");
  }, []);

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editSlug.trim() || saving || !editItem) return;
    setSaving(true);
    try {
      await OrganizationService.updateItem(collectionName, editItem.id, {
        name: editName,
        slug: editSlug,
        status: editStatus,
      }, user);
      toast.success(`${meta.singular} updated`);
      setEditItem(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = useCallback(async (item) => {
    try {
      await OrganizationService.createItem(collectionName, {
        name: `${item.name} (Copy)`,
        slug: `${item.slug}-copy`,
        description: item.description || "",
        status: item.status || "active",
      }, user);
      toast.success(`${meta.singular} duplicated`);
    } catch (err) {
      toast.error(err.message);
    }
  }, [collectionName, user, meta.singular]);

  const fmtShortDate = (v) => {
    if (!v) return "—";
    try {
      const d = v.toDate ? v.toDate() : new Date(v);
      if (Number.isNaN(d.getTime())) return "—";
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return "—";
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await OrganizationService.softDeleteItem(collectionName, deleteConfirm.id, user);
      toast.success(`${meta.singular}: "${deleteConfirm.name}" deleted`, {
        duration: 5000,
      });
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }, [collectionName, deleteConfirm, user, meta.singular]);

  const handleCreated = useCallback(() => {
    setCreateOpen(false);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-red-400 mb-4" />
        <p className="text-sm font-semibold text-red-600 mb-1">Failed to load {meta.label}</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.15em]">Organization</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{meta.label}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
          >
            <Plus size={16} /> Create {meta.singular}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {COLLECTIONS.map((c) => {
          const m = COLLECTION_META[c];
          const TabIcon = m.icon;
          return (
            <Link
              key={c}
              to={`/admin/organization/${c}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${
                collectionName === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TabIcon size={15} />
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            className="w-full h-11 pl-10 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
            {loading ? "..." : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("name")}>
                  Name <SortIcon field="name" />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("slug")}>
                  Slug <SortIcon field="slug" />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Products
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("status")}>
                  Status <SortIcon field="status" />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                  Created <SortIcon field="createdAt" />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("updatedAt")}>
                  Updated <SortIcon field="updatedAt" />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/80 px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FolderOpen size={32} className="text-slate-300" />
                      </div>
                      {search || statusFilter !== "all" ? (
                        <>
                          <p className="text-base font-semibold text-slate-600">No matching items</p>
                          <p className="text-sm text-slate-400 max-w-sm">
                            Try adjusting your search or filter criteria.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-semibold text-slate-600">No {meta.label} Found</p>
                          <p className="text-sm text-slate-400 max-w-sm">
                            Create your first {meta.singular.toLowerCase()} to organize your products.
                          </p>
                          <button
                            onClick={() => setCreateOpen(true)}
                            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
                          >
                            <Plus size={16} /> Create {meta.singular}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => openView(item)}
                    className={`group border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-400 font-mono">/{item.slug}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 font-mono font-medium text-right">
                      {productCounts[item.id] ?? item.productCount ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{item.createdAt ? fmtShortDate(item.createdAt) : "—"}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{item.updatedAt ? fmtShortDate(item.updatedAt) : "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          onView={() => openView(item)}
                          onEdit={() => openEdit(item)}
                          onDelete={() => setDeleteConfirm(item)}
                          onDuplicate={handleDuplicate ? () => handleDuplicate(item) : null}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            {filteredItems.length === 0
              ? "0 items"
              : `Showing ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filteredItems.length)} of ${filteredItems.length} ${meta.label.toLowerCase()}`
            }
          </p>
          {filteredItems.length > PAGE_SIZE && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(0)}
                disabled={safePage === 0}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="First page"
              >
                «
              </button>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      i === safePage ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    aria-label={`Page ${i + 1}`}
                    aria-current={i === safePage ? "page" : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={safePage >= totalPages - 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Last page"
              >
                »
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        collectionName={collectionName}
        title={`Create ${meta.singular}`}
        onCreated={handleCreated}
      />

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`${meta.singular} Details`}
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setViewItem(null)}
              className="px-4 py-2 rounded-[10px] bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const target = viewItem;
                setViewItem(null);
                openEdit(target);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Pencil size={15} /> Edit {meta.singular}
            </button>
          </div>
        }
      >
        {viewItem && (
          <div className="space-y-4 text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewItem.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">/{viewItem.slug}</p>
              </div>
              <StatusBadge status={viewItem.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Products</p>
                <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {productCounts[viewItem.id] ?? viewItem.productCount ?? 0}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-slate-800 capitalize mt-1.5">{viewItem.status || "Active"}</p>
              </div>
            </div>

            {viewItem.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{viewItem.description}</p>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-400 flex flex-col gap-1 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-medium text-slate-600">{fmtShortDate(viewItem.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-600">{fmtShortDate(viewItem.updatedAt)}</span>
              </div>
            </div>

            {collectionName === "categories" && (
              <div className="pt-2">
                <a
                  href={`/${viewItem.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Eye size={13} /> View on Storefront →
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit ${meta.singular}`}
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="px-4 py-2 rounded-[10px] bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={!editName.trim() || !editSlug.trim() || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        <form id="edit-form" onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Slug *</label>
            <input
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => !deleting && setDeleteConfirm(null)}
        title="Confirm Delete"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-[10px] bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm shadow-red-600/20"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Delete "{deleteConfirm?.name}"?</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              This {meta.singular.toLowerCase()} will be soft-deleted and removed from active management lists. You can confirm or cancel below.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}


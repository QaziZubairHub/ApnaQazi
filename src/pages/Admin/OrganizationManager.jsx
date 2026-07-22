import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganizationItems } from "../../products/hooks/useOrganizationItems";
import { OrganizationService } from "../../services/OrganizationService";
import {
  Plus, Search, Edit3, Trash2,
  ToggleLeft, ToggleRight, FolderOpen, Tags, Bookmark, Layers,
  ChevronLeft, ChevronRight, X, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import { QuickCreateModal } from "../../products/components/ui/QuickCreateModal";

const PAGE_SIZE = 10;
const COLLECTIONS = ["categories", "brands", "collections"];

const COLLECTION_META = {
  categories: { label: "Categories", icon: Tags, singular: "Category" },
  brands: { label: "Brands", icon: Bookmark, singular: "Brand" },
  collections: { label: "Collections", icon: Layers, singular: "Collection" },
};

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: i === 3 ? "5rem" : i === 4 ? "6rem" : `${60 + i * 10}%` }} />
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [createOpen, setCreateOpen] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-slate-300">&#8597;</span>;
    return <span className="ml-1 text-slate-500">{sortDir === "asc" ? "&#8593;" : "&#8595;"}</span>;
  };

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

  const handleToggleStatus = useCallback(async (id, name, currentStatus) => {
    const next = currentStatus === "active" ? "inactive" : "active";
    try {
      await OrganizationService.toggleStatus(collectionName, id, currentStatus, user);
      toast.success(`"${name}" ${next}`);
    } catch (err) {
      toast.error(err.message);
    }
  }, [collectionName, user]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
            <Icon size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.15em]">Organization</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{meta.label}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={15} /> Create {meta.singular}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-[10px] w-fit">
        {COLLECTIONS.map((c) => {
          const m = COLLECTION_META[c];
          const TabIcon = m.icon;
          return (
            <Link
              key={c}
              to={`/admin/organization/${c}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                collectionName === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TabIcon size={14} />
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-2 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
            {loading ? "..." : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("name")}>
                  Name <SortIcon field="name" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("slug")}>
                  Slug <SortIcon field="slug" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("status")}>
                  Status <SortIcon field="status" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen size={32} className="text-slate-300" />
                      <p className="text-sm text-slate-400">
                        {search || statusFilter !== "all"
                          ? "No items match your filters"
                          : `No ${collectionName} yet. Create your first one.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors group">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">/{item.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.id, item.name, item.status)}
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title={item.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {item.status === "active" ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
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

      {/* Pagination */}
      {!loading && filteredItems.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-[8px] text-xs font-semibold transition-colors ${
                  i === safePage ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
          </div>
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
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Slug</label>
            <input
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Delete "{deleteConfirm?.name}"?</p>
            <p className="mt-1 text-xs text-slate-500">
              This {meta.singular.toLowerCase()} will be soft-deleted and hidden from active lists. You cannot undo this action.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

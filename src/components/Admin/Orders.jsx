import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download, ChevronLeft,
  ChevronRight, MapPin, CheckSquare, Square,
} from "lucide-react";
import useOrders from "../../hooks/useOrders";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SearchInput from "../ui/SearchInput";
import StatusDropdown from "../ui/StatusDropdown";
import Drawer from "../ui/Drawer";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";
import { TableRowSkeleton } from "../ui/Skeleton";
import { parseNumber, formatCurrency, truncateId } from "../../util/helpers";

const PAGE_SIZES = [10, 25, 50];


const Orders = () => {
  const { orders, loading, stats, updateStatus } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "All") {
      result = result.filter(o => (o.orderStatus || o.status || "Pending").toLowerCase() === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o => {
        const name = o.shippingAddress
          ? `${o.shippingAddress.firstName || ""} ${o.shippingAddress.lastName || ""} ${o.customerEmail || ""}`.toLowerCase()
          : (o.customerEmail || "").toLowerCase();
        return o.id.toLowerCase().includes(q) || name.includes(q);
      });
    }
    return result;
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map(o => o.id));
  };

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    const csv = [
      ["Order ID", "Customer", "Amount", "Status", "Date"].join(","),
      ...filtered.map(o => {
        const name = o.shippingAddress ? `${o.shippingAddress.firstName || ""} ${o.shippingAddress.lastName || ""}`.trim() : o.customerEmail;
        return [o.id, `"${name}"`, parseNumber(o.totalAmount || o.paymentInfo?.totalAmount || 0), o.status || o.orderStatus || "Pending", o.createdAt?.toDate?.()?.toLocaleString() || ""].join(",");
      })
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Management</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage orders, update statuses, and track shipments</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="danger" size="md" icon={CheckSquare}>
              Bulk Action ({selected.length})
            </Button>
          )}
          <Button variant="ghost" size="md" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card hover={false}>
          <p className="text-xs text-slate-500 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.count}</p>
        </Card>
        <Card hover={false}>
          <p className="text-xs text-slate-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </Card>
        <Card hover={false}>
          <p className="text-xs text-slate-500 font-medium">Shipped</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{stats.shipped}</p>
        </Card>
        <Card hover={false}>
          <p className="text-xs text-slate-500 font-medium">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.delivered}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." className="sm:max-w-xs" />
          <div className="flex gap-1.5 flex-wrap">
            {["All", "Pending", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-2.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                  statusFilter === s ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card padding={false} hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-primary transition-colors">
                    {selected.length === paginated.length && paginated.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Products</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Payment</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={9} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No orders found" description="Orders will appear here once customers place orders" />
                  </td>
                </tr>
              ) : (
                paginated.map((order, idx) => {
                  const name = order.shippingAddress
                    ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim()
                    : order.customerEmail || "Guest";
                  const status = order.orderStatus || order.status || "Pending";
                  const products = (order.orderItems || []).map(i => i.name).join(", ") || "—";
                  const amount = parseNumber(order.totalAmount || order.paymentInfo?.totalAmount || order.subtotal || 0);
                  const paymentMethod = order.paymentInfo?.method || "COD";
                  const date = order.createdAt?.toDate?.() || null;
                  const isSelected = selected.includes(order.id);

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(order.id)} className={isSelected ? "text-primary" : "text-slate-300 hover:text-slate-500"}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-slate-800">{truncateId(order.id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={name} size="sm" />
                          <span className="text-slate-700 text-xs truncate max-w-[140px]">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                        <span className="truncate max-w-[160px] block text-xs">{products.length > 40 ? products.slice(0, 40) + "..." : products}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{formatCurrency(amount)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500">{paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusDropdown value={status} onChange={(s) => updateStatus(order.id, s)} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">
                        {date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDrawer(order)}
                          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="rounded-[8px] border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="ml-2">{filtered.length} results</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-xs font-medium transition-colors ${
                      page === p ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Detail Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Order ${selectedOrder ? truncateId(selectedOrder.id) : ""}`} width="max-w-2xl">
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</h4>
              <div className="rounded-[16px] bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedOrder.shippingAddress ? `${selectedOrder.shippingAddress.firstName || ""} ${selectedOrder.shippingAddress.lastName || ""}` : selectedOrder.customerEmail} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selectedOrder.shippingAddress ? `${selectedOrder.shippingAddress.firstName || ""} ${selectedOrder.shippingAddress.lastName || ""}` : selectedOrder.customerEmail}</p>
                    <p className="text-xs text-slate-400">{selectedOrder.customerEmail || selectedOrder.shippingAddress?.email || "—"}</p>
                  </div>
                </div>
                {selectedOrder.shippingAddress && (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</span>
                  </div>
                )}
                {selectedOrder.shippingAddress?.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} /> <span>{selectedOrder.shippingAddress.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Products</h4>
                <div className="rounded-[16px] border border-slate-200 overflow-hidden">
                  {selectedOrder.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>Color: <span className="text-slate-700 font-medium">{item.selectedColor || item.color || "—"}</span></span>
                          <span>Size: <span className="text-slate-700 font-medium">{item.selectedSize || item.size || "—"}</span></span>
                          <span>Qty: <span className="text-slate-700 font-medium">{item.quantity}</span></span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(item.lineTotal || item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment</h4>
              <div className="rounded-[16px] bg-slate-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="text-slate-800 font-medium">{selectedOrder.paymentMethod || selectedOrder.paymentInfo?.method || "COD"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-800">{formatCurrency(selectedOrder.subtotal || selectedOrder.paymentInfo?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-800">{formatCurrency(selectedOrder.shippingFee || selectedOrder.paymentInfo?.shippingCost || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedOrder.paymentInfo?.totalAmount || selectedOrder.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</h4>
              <div className="flex items-center gap-3">
                <StatusDropdown
                  value={selectedOrder.orderStatus || selectedOrder.status || "Pending"}
                  onChange={(s) => { updateStatus(selectedOrder.id, s); setSelectedOrder({ ...selectedOrder, status: s }); }}
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const Phone = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;

export default Orders;

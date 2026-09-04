import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Download, Mail, Phone, MapPin, ShoppingBag, DollarSign, FileText } from "lucide-react";
import useCustomers from "../../hooks/useCustomers";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Drawer from "../../components/ui/Drawer";
import EmptyState from "../../components/ui/EmptyState";
import { StatCardSkeleton, CardSkeleton } from "../../components/ui/Skeleton";
import { formatCurrency } from "../../util/helpers";

const Customers = () => {
  const { customers, loading, stats } = useCustomers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = customers;
    if (statusFilter !== "All") {
      result = result.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        [c.fullName, c.name, c.email, c.phone, c.city, c.country]
          .filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    return result;
  }, [customers, search, statusFilter]);

  const openDrawer = (customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Management</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer accounts, orders, and spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" icon={Download}>Export CSV</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <Card hover={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Customers</p>
                  <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card hover={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active</p>
                  <p className="text-xl font-bold text-slate-900">{stats.active}</p>
                </div>
              </div>
            </Card>
            <Card hover={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-red-50 flex items-center justify-center text-red-600">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Blocked</p>
                  <p className="text-xl font-bold text-slate-900">{stats.blocked}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="sm:max-w-xs" />
        <div className="flex gap-2 flex-wrap">
          {["All", "Active", "Blocked"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No customers found"
            description={search ? "Try a different search term" : "Customers will appear here once they register"}
          />
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer, idx) => (
            <motion.div
              key={customer.id || idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              onClick={() => openDrawer(customer)}
              className="card-lift rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={customer.fullName || customer.name || customer.email} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{customer.fullName || customer.name || "Customer"}</h3>
                    <Badge status={customer.status || "Active"} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{customer.email || "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={12} />
                  <span>{customer.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin size={12} />
                  <span>{customer.city ? `${customer.city}, ${customer.country || ""}` : "—"}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Orders</p>
                  <p className="text-sm font-bold text-slate-800">{customer.totalOrders ?? 0}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Total Spent</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(customer.totalSpent || 0)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Customer Detail Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Customer Details">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedCustomer.fullName || selectedCustomer.name} size="xl" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.fullName || selectedCustomer.name}</h3>
                <Badge status={selectedCustomer.status || "Active"} size="md" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-700">{selectedCustomer.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-slate-400" />
                <span className="text-slate-700">{selectedCustomer.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-slate-700">{selectedCustomer.city ? `${selectedCustomer.city}, ${selectedCustomer.country || ""}` : "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[16px] bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <ShoppingBag size={14} />
                  <span className="text-xs font-medium">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{selectedCustomer.totalOrders ?? 0}</p>
              </div>
              <div className="rounded-[16px] bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <DollarSign size={14} />
                  <span className="text-xs font-medium">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedCustomer.totalSpent || 0)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText size={14} />
                Notes
              </div>
              <textarea
                placeholder="Add notes about this customer..."
                className="w-full h-24 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Customers;

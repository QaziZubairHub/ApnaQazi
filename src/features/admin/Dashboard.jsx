import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, PackageCheck, PackageX, Clock } from "lucide-react";
import useOrders from "../../hooks/useOrders";
import useCustomers from "../../hooks/useCustomers";
import useProducts from "../../hooks/useProducts";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { StatCardSkeleton } from "../../components/ui/Skeleton";
import RevenueChart from "./charts/RevenueChart";
import { formatCurrency, truncateId } from "../../util/helpers";
import ActivityFeed from "./ActivityFeed";
import QuickActions from "./QuickActions";

const Dashboard = () => {
  const { orders, loading: ordersLoading, stats, sparkData } = useOrders();
  const { customers, loading: custLoading } = useCustomers();
  const { loading: prodLoading, totalProducts } = useProducts();

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
  const recentCustomers = useMemo(() => customers.slice(0, 5), [customers]);

  const growthRates = useMemo(() => {
    const mr = stats.monthlyRevenue;
    if (mr.length < 2) return { revenue: 0, orders: 0, customers: 0, products: 0 };
    const last = mr[mr.length - 1].value;
    const prev = mr[mr.length - 2].value;
    const revGrowth = prev > 0 ? ((last - prev) / prev * 100).toFixed(1) : 0;
    return {
      revenue: Number(revGrowth),
      orders: 18.2,
      customers: 8.1,
      products: -2.3,
    };
  }, [stats.monthlyRevenue]);

  const pipelineItems = [
    { label: "Pending", count: stats.pending, icon: Clock, color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700" },
    { label: "Processing", count: stats.processing, icon: TrendingUp, color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700" },
    { label: "Packed", count: stats.packed, icon: Package, color: "bg-cyan-500", lightBg: "bg-cyan-50", textColor: "text-cyan-700" },
    { label: "Shipped", count: stats.shipped, icon: ShoppingCart, color: "bg-violet-500", lightBg: "bg-violet-50", textColor: "text-violet-700" },
    { label: "Delivered", count: stats.delivered, icon: PackageCheck, color: "bg-emerald-500", lightBg: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: "Cancelled", count: stats.cancelled, icon: PackageX, color: "bg-red-500", lightBg: "bg-red-50", textColor: "text-red-700" },
  ];

  const loading = ordersLoading || custLoading || prodLoading;

  return (
    <div className="space-y-6">
      <QuickActions />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Overview</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time metrics from your marketplace activity</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-white text-sm font-semibold shadow-md shadow-primary/15 hover:bg-primary/90 transition-colors"
          >
            <TrendingUp size={15} />
            <span className="whitespace-nowrap">Export Report</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-white text-sm font-semibold shadow-md shadow-secondary/15 hover:bg-secondary/90 transition-colors"
          >
            <Clock size={15} />
            <span className="whitespace-nowrap">Export Orders</span>
          </button>
        </div>

      </div>

      {/* Row 1 — Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Revenue"
              value={stats.revenue}
              prefix="Rs "
              growth={growthRates.revenue}
              icon={DollarSign}
              iconBg="from-emerald-500 to-teal-600"
              sparkData={sparkData}
              sparkColor="#10B981"
              delay={0}
            />
            <StatCard
              title="Orders"
              value={stats.count}
              growth={growthRates.orders}
              icon={ShoppingCart}
              iconBg="from-primary to-secondary"
              sparkData={sparkData}
              sparkColor="#5B3DF5"
              delay={0.05}
            />
            <StatCard
              title="Customers"
              value={customers.length}
              growth={growthRates.customers}
              icon={Users}
              iconBg="from-amber-500 to-orange-600"
              sparkData={sparkData}
              sparkColor="#F59E0B"
              delay={0.1}
            />
            <StatCard
              title="Products"
              value={totalProducts}
              growth={growthRates.products}
              icon={Package}
              iconBg="from-violet-500 to-purple-600"
              sparkData={sparkData}
              sparkColor="#7C4DFF"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Row 2 — Revenue Chart + Order Pipeline */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1.4fr_1fr]">
        <Card padding={false} hover={false}>
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Revenue Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monthly revenue over the last 6 months</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>
          <div className="px-2 pb-2">
            <RevenueChart data={stats.monthlyRevenue} height={280} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Order Pipeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time order status distribution</p>
            </div>
          </div>
          <div className="space-y-3">
            {pipelineItems.map((item, idx) => {
              const Icon = item.icon;
              const pct = stats.count > 0 ? (item.count / stats.count * 100) : 0;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 group cursor-pointer rounded-[12px] p-2.5 -mx-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${item.lightBg} ${item.textColor} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 3 — Recent Orders + Recent Customers */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent Orders */}
        <Card padding={false} hover={false}>
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest orders from Firestore</p>
              </div>
              <a href="/admin/order" className="text-xs text-primary font-medium hover:underline">View all</a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order, idx) => {
                    const name = order.shippingAddress
                      ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim()
                      : order.customerEmail || "Guest";
                    const status = order.orderStatus || order.status || "Pending";
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-slate-800 text-xs font-mono">{truncateId(order.id)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{name}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">{formatCurrency(order.totalAmount || order.paymentInfo?.totalAmount || 0)}</td>
                        <td className="px-6 py-3.5">
                          <Badge status={status} size="sm" />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Customers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Customers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest sign-ups and activity</p>
            </div>
            <a href="/admin/customers" className="text-xs text-primary font-medium hover:underline">View all</a>
          </div>
          <div className="space-y-2.5">
            {recentCustomers.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No customers yet</div>
            ) : (
              recentCustomers.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Avatar name={c.fullName || c.name || c.email || ""} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.fullName || c.name || "Customer"}</p>
                    <p className="text-xs text-slate-400 truncate">{c.email || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-600">{c.totalOrders ?? 0} orders</p>
                    <Badge status={c.status || "Active"} size="sm" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 4 — Activity Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Marketplace Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live updates from your store</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Real-time
          </span>
        </div>
        <ActivityFeed />
      </Card>
    </div>
  );
};

export default Dashboard;

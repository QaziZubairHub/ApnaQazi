import { useMemo, useState } from "react";
import { Zap, BarChart3, Package, AlertTriangle, DollarSign, LayoutDashboard } from "lucide-react";
import useOrders from "../../hooks/useOrders";
import useCustomers from "../../hooks/useCustomers";
import useProducts from "../../hooks/useProducts";
import Card from "../ui/Card";
import RevenueChart from "../charts/RevenueChart";
import CustomerGrowth from "../charts/CustomerGrowth";
import TopProductsChart from "../charts/TopProductsChart";
import OrderHeatmap from "../charts/OrderHeatmap";
import { formatCurrency } from "../../util/helpers";
import { DashboardSummary } from "../../products/components/reports/DashboardSummary";
import { ProductReport } from "../../products/components/reports/ProductReport";
import { InventoryReport } from "../../products/components/reports/InventoryReport";
import { RevenueReport } from "../../products/components/reports/RevenueReport";

const timeRanges = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
];

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "summary", label: "Summary", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "inventory", label: "Inventory", icon: AlertTriangle },
  { key: "revenue", label: "Revenue", icon: DollarSign },
];

const Analytics = () => {
  const { stats, orders } = useOrders();
  const { customers } = useCustomers();
  useProducts();
  const [range, setRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Customer growth data
  const customerGrowthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((label, idx) => ({
      label,
      value: Math.round(customers.length * (0.3 + idx * 0.1 + Math.random() * 0.2)),
    }));
  }, [customers.length]);

  // Top products data
  const topProductsData = useMemo(() => {
    const productSales = {};
    orders.forEach(o => {
      (o.orderItems || []).forEach(item => {
        productSales[item.name || "Unknown"] = (productSales[item.name || "Unknown"] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, value }));
  }, [orders]);

  // AI predictions
  const predictions = useMemo(() => {
    const mr = stats.monthlyRevenue;
    if (mr.length < 2) return { forecast: 0, trend: "stable" };
    const values = mr.map(m => m.value);
    const latest = values[values.length - 1];
    const prevAvg = values.slice(0, -1).reduce((a, b) => a + b, 0) / (values.length - 1);
    const growthRate = prevAvg > 0 ? (latest - prevAvg) / prevAvg : 0;
    const forecast = Math.round(latest * (1 + growthRate));
    const trend = growthRate > 0.1 ? "growing" : growthRate < -0.1 ? "declining" : "stable";
    return { forecast, trend, growthRate: (growthRate * 100).toFixed(1) };
  }, [stats.monthlyRevenue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Insights</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Deep-dive into your marketplace performance</p>
        </div>
        {activeTab === "overview" && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-[10px]">
            {timeRanges.map((t) => (
              <button
                key={t.value}
                onClick={() => setRange(t.value)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                  range === t.value ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-[12px] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                <Zap size={15} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI Sales Forecast</h3>
                <p className="text-xs text-slate-500">Predicted next month revenue based on trends</p>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-[16px] bg-gradient-to-br from-primary/5 to-secondary/5 p-5 border border-primary/10">
                <p className="text-xs text-slate-500 font-medium mb-1">Predicted Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(predictions.forecast)}</p>
                <p className="text-xs text-slate-400 mt-1">Next month estimate</p>
              </div>
              <div className="rounded-[16px] bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border border-emerald-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Growth Trend</p>
                <p className={`text-2xl font-bold ${predictions.trend === "growing" ? "text-emerald-600" : predictions.trend === "declining" ? "text-red-600" : "text-slate-700"}`}>
                  {predictions.trend === "growing" ? "↑ Growing" : predictions.trend === "declining" ? "↓ Declining" : "→ Stable"}
                </p>
                <p className="text-xs text-slate-400 mt-1">{predictions.growthRate}% month-over-month</p>
              </div>
              <div className="rounded-[16px] bg-gradient-to-br from-amber-50 to-orange-50 p-5 border border-amber-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Top Customer</p>
                <p className="text-2xl font-bold text-amber-700">{customers[0]?.fullName || customers[0]?.name || "N/A"}</p>
                <p className="text-xs text-slate-400 mt-1">{formatCurrency(customers[0]?.totalSpent || 0)} total spent</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Revenue Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monthly revenue performance</p>
              </div>
              <RevenueChart data={stats.monthlyRevenue} height={300} />
            </Card>
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Customer Growth</h3>
                <p className="text-xs text-slate-500 mt-0.5">New customers over time</p>
              </div>
              <CustomerGrowth data={customerGrowthData} height={300} />
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Top Products</h3>
                <p className="text-xs text-slate-500 mt-0.5">Best-selling products by quantity</p>
              </div>
              {topProductsData.length > 0 ? (
                <TopProductsChart data={topProductsData} height={280} />
              ) : (
                <div className="flex items-center justify-center h-64 text-sm text-slate-400">No sales data available yet</div>
              )}
            </Card>
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Order Heatmap</h3>
                <p className="text-xs text-slate-500 mt-0.5">Order density by day and time</p>
              </div>
              {stats.heatmap && Object.keys(stats.heatmap).length > 0 ? (
                <OrderHeatmap data={stats.heatmap} />
              ) : (
                <div className="flex items-center justify-center h-64 text-sm text-slate-400">Not enough data for heatmap</div>
              )}
            </Card>
          </div>
        </>
      ) : activeTab === "summary" ? (
        <DashboardSummary />
      ) : activeTab === "products" ? (
        <ProductReport />
      ) : activeTab === "inventory" ? (
        <InventoryReport />
      ) : activeTab === "revenue" ? (
        <RevenueReport />
      ) : null}
    </div>
  );
};

export default Analytics;

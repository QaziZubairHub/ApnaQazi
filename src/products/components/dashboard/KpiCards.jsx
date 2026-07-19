import { motion } from "framer-motion";
import { Package, Eye, FileEdit, Archive, Star, PackageX, AlertTriangle, BarChart3, TrendingUp, DollarSign, Flame, CalendarDays } from "lucide-react";
import { useProductStats } from "../../hooks/useProductStats";
import { StatCardSkeleton } from "../../../components/ui/Skeleton";
import { formatCurrency } from "../../../util/helpers";

const KPI_CARDS = [
  { key: "totalProducts", title: "Total Products", icon: Package, color: "from-indigo-500 to-purple-600" },
  { key: "publishedProducts", title: "Published", icon: Eye, color: "from-emerald-500 to-teal-600" },
  { key: "draftProducts", title: "Draft", icon: FileEdit, color: "from-amber-500 to-orange-600" },
  { key: "archivedProducts", title: "Archived", icon: Archive, color: "from-slate-500 to-gray-600" },
  { key: "featuredProducts", title: "Featured", icon: Star, color: "from-yellow-500 to-amber-600" },
  { key: "bestSellers", title: "Best Sellers", icon: Flame, color: "from-rose-500 to-pink-600" },
  { key: "outOfStock", title: "Out of Stock", icon: PackageX, color: "from-red-500 to-rose-600" },
  { key: "lowStock", title: "Low Stock", icon: AlertTriangle, color: "from-orange-500 to-red-600" },
  { key: "inventoryValue", title: "Inventory Value", icon: DollarSign, color: "from-blue-500 to-cyan-600", format: "currency" },
  { key: "averagePrice", title: "Avg. Price", icon: BarChart3, color: "from-violet-500 to-purple-600", format: "currency" },
  { key: "recentlyAdded", title: "Added Today", icon: TrendingUp, color: "from-green-500 to-emerald-600" },
  { key: "addedThisMonth", title: "Added This Month", icon: CalendarDays, color: "from-cyan-500 to-blue-600" },
];

const StatCard = ({ title, value, icon: Icon, color, format, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-sm card-lift"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${color} text-white shadow-lg`}>
        <Icon size={18} strokeWidth={2.2} />
      </div>
    </div>
    <p className="text-[13px] font-medium text-slate-500 mb-1">{title}</p>
    <p className="text-2xl font-bold text-slate-900 tracking-tight">
      {format === "currency" ? formatCurrency(value) : value.toLocaleString()}
    </p>
  </motion.div>
);

export function KpiCards() {
  const { stats, loading } = useProductStats();

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {KPI_CARDS.map((card, i) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={stats[card.key]}
          icon={card.icon}
          color={card.color}
          format={card.format}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}

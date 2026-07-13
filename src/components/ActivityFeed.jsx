import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, UserPlus, Package, RotateCcw, Clock } from "lucide-react";
import useActivityFeed from "../hooks/useActivityFeed";
import { timeAgo } from "../util/helpers";

const iconMap = {
  "shopping-bag": ShoppingBag,
  "user-plus": UserPlus,
  "package": Package,
  "refund": RotateCcw,
};

const colorMap = {
  order: { bg: "bg-primary/10", text: "text-primary" },
  customer: { bg: "bg-emerald-50", text: "text-emerald-600" },
  product: { bg: "bg-amber-50", text: "text-amber-600" },
  refund: { bg: "bg-red-50", text: "text-red-600" },
};

const ActivityFeed = () => {
  const { activities } = useActivityFeed(15);

  return (
    <div className="space-y-1">
      {activities.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No recent activity</div>
      ) : (
        <AnimatePresence initial={false}>
          {activities.map((item, idx) => {
            const Icon = iconMap[item.icon] || Clock;
            const colors = colorMap[item.type] || colorMap.order;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="flex items-start gap-3 py-3 px-3 rounded-[12px] hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.description}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{item.timeAgo || timeAgo(item.timestamp)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ActivityFeed;

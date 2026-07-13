import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import Sparkline from "./Sparkline";

const StatCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  growth,
  icon: Icon,
  iconBg = "from-primary to-secondary",
  sparkData = [],
  sparkColor = "#5B3DF5",
  delay = 0,
}) => {
  const isPositive = growth >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-lift rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br ${iconBg} text-white shadow-lg shadow-primary/15`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
        {typeof growth === "number" && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPositive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}>
            <span className={`inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent ${isPositive ? "border-b-[5px] border-b-emerald-600" : "border-t-[5px] border-t-red-600"}`} />
            {Math.abs(growth)}%
          </span>
        )}
      </div>

      <div className="mb-1">
        <p className="text-[13px] font-medium text-slate-500">{title}</p>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
          <AnimatedCounter value={typeof value === "number" ? value : 0} prefix={prefix} suffix={suffix} />
        </p>
        {sparkData.length > 0 && <Sparkline data={sparkData} color={sparkColor} height={36} />}
      </div>
    </motion.div>
  );
};

export default StatCard;

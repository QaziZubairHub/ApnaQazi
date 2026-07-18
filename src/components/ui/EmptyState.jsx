import { Inbox } from "lucide-react";
import { motion } from "framer-motion";

const EmptyState = ({ title = "No data found", description = "There's nothing here yet.", icon: Icon = Inbox, action, actionLabel, actionButtons }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-[20px] bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 px-4 py-2 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          {actionLabel}
        </button>
      )}
      {actionButtons && (
        <div className="mt-4">{actionButtons}</div>
      )}
    </motion.div>
  );
};

export default EmptyState;

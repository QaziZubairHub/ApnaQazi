import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Package, FileText, Tag, Users } from "lucide-react";

const actions = [
  { icon: Package, label: "Create Product", color: "bg-primary hover:bg-primary/90", href: "/admin/product" },
  { icon: FileText, label: "Create Invoice", color: "bg-secondary hover:bg-secondary/90", href: "/admin/invoices/create" },
  { icon: Tag, label: "TEC", color: "bg-accent hover:bg-accent/90", href: "/admin/settings" },
  { icon: Users, label: "Add Customer", color: "bg-success hover:bg-success/90", href: "/admin/customers" },
];

const QuickActions = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 flex flex-col gap-2"
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={action.href || "#"}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-[14px] text-white text-sm font-medium shadow-lg transition-colors ${action.color}`}
                  >
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        {open ? <X size={22} /> : <Plus size={22} />}
      </motion.button>
    </div>
  );
};

export default QuickActions;

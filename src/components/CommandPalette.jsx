import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ShoppingCart, Package, BarChart3,
  Settings, Search, Plus, FileText, Tag, ArrowRight,
} from "lucide-react";

const commands = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: "/admin/dashboard", category: "Navigate" },
  { id: "customers", label: "Customers", icon: Users, action: "/admin/customers", category: "Navigate" },
  { id: "orders", label: "Orders", icon: ShoppingCart, action: "/admin/order", category: "Navigate" },
  { id: "products", label: "Products", icon: Package, action: "/admin/product", category: "Navigate" },
  { id: "analytics", label: "Analytics", icon: BarChart3, action: "/admin/analytics", category: "Navigate" },
  { id: "settings", label: "Settings", icon: Settings, action: "/admin/settings", category: "Navigate" },
  { id: "create-product", label: "Create Product", icon: Plus, action: "create-product", category: "Actions" },
  { id: "create-invoice", label: "Create Invoice", icon: FileText, action: "create-invoice", category: "Actions" },
  { id: "create-coupon", label: "Create Coupon", icon: Tag, action: "create-coupon", category: "Actions" },
  { id: "add-customer", label: "Add Customer", icon: Users, action: "add-customer", category: "Actions" },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((p) => Math.min(p + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((p) => Math.max(p - 1, 0));
    }
    if (e.key === "Enter" && filtered[selected]) {
      handleSelect(filtered[selected]);
    }
    if (e.key === "Escape") onClose();
  };

  const handleSelect = (cmd) => {
    if (cmd.action.startsWith("/")) {
      navigate(cmd.action);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-[20px] shadow-2xl border border-slate-200 overflow-hidden z-[110]"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-slate-100 text-[10px] text-slate-500 font-mono border border-slate-200">ESC</kbd>
            </div>
            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2 px-3">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No results found</div>
              ) : (
                filtered.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-colors ${
                        idx === selected ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                        idx === selected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        <Icon size={15} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{cmd.label}</p>
                        <p className="text-[11px] text-slate-400">{cmd.category}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300" />
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;

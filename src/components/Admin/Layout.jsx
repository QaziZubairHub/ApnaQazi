import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ShoppingCart, Package, BarChart3,
  Settings, ChevronLeft, ChevronRight, Search, Bell,
  FileText, Ticket,
} from "lucide-react";
import LoginRegister, { UserMenu } from "./Login_Register";
import CommandPalette from "../CommandPalette";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../ui/Avatar";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, link: "/admin/dashboard" },
  { label: "Customers", icon: Users, link: "/admin/customers" },
  { label: "Orders", icon: ShoppingCart, link: "/admin/order" },
  { label: "Products", icon: Package, link: "/admin/product" },
  { label: "Products (Enhanced)", icon: Package, link: "/admin/products" },
  { label: "Invoices", icon: FileText, link: "/admin/payment" },
  { label: "Coupons", icon: Ticket, link: "/admin/coupons" },
  { label: "Analytics", icon: BarChart3, link: "/admin/analytics" },
  { label: "Settings", icon: Settings, link: "/admin/settings" },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { user, userData } = useAuth();

  // Global Ctrl+K
  useState(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const displayName = userData?.fullname || user?.displayName || user?.email?.split("@")[0] || "Admin";

  // ─── Sidebar ───
  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full bg-[#0B1121] text-slate-300">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
            A
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="overflow-hidden"
            >
              <h2 className="text-base font-bold text-white tracking-tight">ApnaQazi</h2>
              <p className="text-[11px] text-slate-500 font-medium">Admin Dashboard</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.link ||
            (item.link === "/admin/dashboard" && location.pathname === "/admin");
          const Icon = item.icon;
          return (
            <Link
              key={item.link}
              to={item.link}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary/15 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full"
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} className={`shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Version */}
      <div className="px-5 py-3 border-t border-white/5 text-center">
        <span className="text-[10px] text-slate-600 font-mono">v3.0 Enterprise</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden lg:block fixed top-0 left-0 h-screen z-50 border-r border-white/5 shadow-2xl"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/40 shadow-sm z-50 transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-screen w-[280px] z-50 shadow-2xl"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 lg:transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        {/* Top Navbar */}
        <header className="glass sticky top-0 z-40 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-[10px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            {/* Search trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-[12px] bg-slate-100/80 hover:bg-slate-200/60 text-slate-400 text-sm transition-colors border border-slate-200/60"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className="ml-4 px-1.5 py-0.5 rounded-[5px] bg-white text-[10px] text-slate-400 font-mono border border-slate-200">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-[16px] shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                      <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Mark all read</span>
                    </div>
                    <div className="py-2 max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-slate-700">New order received</p>
                        <p className="text-xs text-slate-400 mt-0.5">2 minutes ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-slate-700">New customer registered</p>
                        <p className="text-xs text-slate-400 mt-0.5">15 minutes ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-slate-700">Payment confirmed</p>
                        <p className="text-xs text-slate-400 mt-0.5">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <UserMenu onOpenAuth={() => setIsAuthOpen(true)} />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 page-enter">
          <Outlet />
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <LoginRegister isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Layout;

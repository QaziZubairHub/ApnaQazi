import { NavLink } from 'react-router-dom';
import {
  Settings,
  ShoppingCart,
  CreditCard,
  Truck,
  Mail,
  MessageCircle,
  Flame,
  Bell,
  FileText,
  Eye,
  Paintbrush,
  ShieldCheck,
  Users,
  BarChart3,
  CloudDownload,
  Code,
  ClipboardList,
  Heart,
  Wrench,
} from 'lucide-react';

const menuItems = [
  { path: 'general', label: 'General', icon: Settings },
  { path: 'store', label: 'Store', icon: ShoppingCart },
  { path: 'payment', label: 'Payment', icon: CreditCard },
  { path: 'shipping', label: 'Shipping', icon: Truck },
  { path: 'email', label: 'Email', icon: Mail },
  { path: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { path: 'firebase', label: 'Firebase', icon: Flame },
  { path: 'notifications', label: 'Notifications', icon: Bell },
  { path: 'invoice', label: 'Invoice', icon: FileText },
  { path: 'seo', label: 'SEO', icon: Eye },
  { path: 'appearance', label: 'Appearance', icon: Paintbrush },
  { path: 'security', label: 'Security', icon: ShieldCheck },
  { path: 'users-roles', label: 'Users & Roles', icon: Users },
  { path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { path: 'backup-restore', label: 'Backup & Restore', icon: CloudDownload },
  { path: 'api', label: 'API', icon: Code },
  { path: 'activity-logs', label: 'Activity Logs', icon: ClipboardList },
  { path: 'system-health', label: 'System Health', icon: Heart },
  { path: 'developer', label: 'Developer', icon: Wrench },
];

const SettingsSidebar = () => {
  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm rounded-md transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default SettingsSidebar;

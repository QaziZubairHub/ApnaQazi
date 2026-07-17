import { NavLink } from 'react-router-dom';
import {
  CogIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  TruckIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  BellIcon,
  DocumentTextIcon,
  EyeIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { path: 'general', label: 'General', icon: CogIcon },
  { path: 'store', label: 'Store', icon: ShoppingCartIcon },
  { path: 'payment', label: 'Payment', icon: CreditCardIcon },
  { path: 'shipping', label: 'Shipping', icon: TruckIcon },
  { path: 'email', label: 'Email', icon: EnvelopeIcon },
  { path: 'whatsapp', label: 'WhatsApp', icon: ChatBubbleLeftRightIcon },
  { path: 'firebase', label: 'Firebase', icon: FireIcon },
  { path: 'notifications', label: 'Notifications', icon: BellIcon },
  { path: 'invoice', label: 'Invoice', icon: DocumentTextIcon },
  { path: 'seo', label: 'SEO', icon: EyeIcon },
  { path: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
  { path: 'security', label: 'Security', icon: ShieldCheckIcon },
  { path: 'users-roles', label: 'Users & Roles', icon: UsersIcon },
  { path: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  { path: 'backup-restore', label: 'Backup & Restore', icon: CloudArrowDownIcon },
  { path: 'api', label: 'API', icon: CodeBracketIcon },
  { path: 'activity-logs', label: 'Activity Logs', icon: ClipboardDocumentListIcon },
  { path: 'system-health', label: 'System Health', icon: HeartIcon },
  { path: 'developer', label: 'Developer', icon: WrenchIcon },
];

const Sidebar = () => {
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

export default Sidebar;

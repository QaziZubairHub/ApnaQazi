import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  const userData = JSON.parse(localStorage.getItem('user') || 'null');
  const isSuperAdmin = userData?.role === 'super_admin';

  if (!userData) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

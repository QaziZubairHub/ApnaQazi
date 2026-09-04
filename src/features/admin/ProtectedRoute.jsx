import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Loading spinner jab tak auth state verify ho raha ho
const FullScreenLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
    <div className="w-11 h-11 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    <p className="mt-4 text-sm font-medium text-slate-500">Verifying access...</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return children ?? <Outlet />;
};

export default ProtectedRoute;
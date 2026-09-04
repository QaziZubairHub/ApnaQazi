import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-[24px] bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={36} className="text-slate-400" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 tracking-tighter">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mt-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/admin/dashboard" className="inline-flex mt-6">
          <Button variant="primary" icon={ArrowLeft}>Back to Dashboard</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;

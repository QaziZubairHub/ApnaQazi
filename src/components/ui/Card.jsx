import { motion } from "framer-motion";

const Card = ({ children, className = "", hover = true, delay = 0, padding = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-[20px] border border-slate-200/80 bg-white shadow-sm ${
        hover ? "card-lift" : ""
      } ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;

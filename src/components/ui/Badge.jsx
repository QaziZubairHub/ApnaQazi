import { getStatusColor } from "../../util/helpers";

const Badge = ({ status, children, className = "", size = "md" }) => {
  const colors = getStatusColor(status || children);
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${colors.bg} ${colors.text} ${colors.border} ${sizes[size]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {children || status}
    </span>
  );
};

export default Badge;

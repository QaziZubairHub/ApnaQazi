import { getInitials, getAvatarColor } from "../../util/helpers";

const Avatar = ({ name = "", src, size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg",
  };
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0 ${sizes[size]} ${className}`} style={{ backgroundColor: src ? "transparent" : bgColor }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;

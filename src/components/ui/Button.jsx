const variants = {
  primary: "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/15",
  secondary: "bg-secondary hover:bg-secondary/90 text-white shadow-md shadow-secondary/15",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-200",
  danger: "bg-danger hover:bg-danger/90 text-white shadow-md shadow-danger/15",
  accent: "bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/15",
  success: "bg-success hover:bg-success/90 text-white shadow-md shadow-success/15",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-[10px]",
  md: "px-4 py-2.5 text-sm rounded-[12px]",
  lg: "px-5 py-3 text-sm rounded-[14px]",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
      ) : null}
      {children}
      {IconRight && <IconRight size={size === "sm" ? 14 : 16} strokeWidth={2.2} />}
    </button>
  );
};

export default Button;

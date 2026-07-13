import { Search } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search...", className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
      />
    </div>
  );
};

export default SearchInput;

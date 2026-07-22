import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Plus } from "lucide-react";

export function EnterpriseSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  loading = false,
  disabled = false,
  emptyMessage = "No items found",
  onCreateNew,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const selectedItem = options.find((o) => o.id === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => (o.name || "").toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[12px] border text-sm transition-all ${
          error
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} focus:outline-none focus:ring-2 focus:ring-primary/20`}
      >
        <span className={selectedItem ? "text-slate-700" : "text-slate-400"}>
          {selectedItem ? selectedItem.name : placeholder}
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-[12px] border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 border-b border-slate-100">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full py-2.5 text-sm text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                {search ? `No "${search}" found` : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    value === item.id
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.name}</span>
                  {value === item.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {onCreateNew && (
            <button
              type="button"
              onClick={() => { onCreateNew(search); setIsOpen(false); setSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-medium border-t border-slate-100 hover:bg-primary/5 transition-colors"
            >
              <Plus size={15} />
              Create New{search ? ` "${search}"` : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

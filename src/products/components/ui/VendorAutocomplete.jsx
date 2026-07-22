import { useState, useMemo, useEffect, useRef } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import { useVendors } from "../../hooks/useVendors";
import { Plus } from "lucide-react";

export function VendorAutocomplete({ value, onChange, error }) {
  const { vendors, loading } = useVendors();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || "");

  const selectedVendor = vendors.find((v) => v.id === value);

  const filteredVendors = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return vendors.filter((v) => (v.name || "").toLowerCase().includes(q));
  }, [vendors, search]);

  useEffect(() => {
    if (!value) setLocalValue("");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateNew = async () => {
    const name = search.trim();
    if (!name) return;
    try {
      const ref = doc(collection(db, "vendors"));
      await setDoc(ref, {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onChange(ref.id);
      setLocalValue(name);
      setSearch("");
      setIsOpen(false);
    } catch (err) {
      console.error("Vendor create failed:", err);
    }
  };

  const handleSelect = (id, name) => {
    onChange(id);
    setLocalValue(name);
    setSearch("");
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    setSearch(val);
    onChange(null);
    if (val) {
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    if (search) setIsOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={selectedVendor ? selectedVendor.name : localValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Search or create vendor..."
        className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${
          error
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (search || filteredVendors.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-[12px] border border-slate-200 bg-white shadow-xl max-h-56 overflow-y-auto py-1">
          {loading && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">Loading...</div>
          )}

          {!loading && filteredVendors.length > 0 && (
            filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => handleSelect(vendor.id, vendor.name)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                  value === vendor.id
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {vendor.name}
                {value === vendor.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          )}

          {!loading && search.trim() && !vendors.some((v) => v.name.toLowerCase() === search.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-medium border-t border-slate-100 hover:bg-primary/5 transition-colors"
            >
              <Plus size={15} />
              Create "{search.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

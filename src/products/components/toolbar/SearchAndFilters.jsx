import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeCollections, subscribeDistinctProductStatuses, subscribeDistinctStockStatuses } from "../../../services/firebase/products";

export function SearchAndFilters({ filters, onSearchChange, onFiltersChange, resetFilters, activeFilterCount }) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [productStatuses, setProductStatuses] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const unsubs = [];

    const load = async () => {
      try {
        const unsubCats = subscribeCollections("categories", (items) => {
          if (cancelled) return;
          setCategories(items.map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id })).filter((x) => x.name));
        });
        unsubs.push(unsubCats);

        const unsubBrands = subscribeCollections("brands", (items) => {
          if (cancelled) return;
          setBrands(items.map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id })).filter((x) => x.name));
        });
        unsubs.push(unsubBrands);

        const unsubColls = subscribeCollections("collections", (items) => {
          if (cancelled) return;
          setCollections(items.map((x) => ({ id: x.id, name: x.name ?? x.title ?? x.slug ?? x.id })).filter((x) => x.name));
        });
        unsubs.push(unsubColls);

        const unsubStatuses = subscribeDistinctProductStatuses((statuses) => {
          if (cancelled) return;
          setProductStatuses(statuses);
        });
        unsubs.push(unsubStatuses);

        const unsubStock = subscribeDistinctStockStatuses((buckets) => {
          if (cancelled) return;
          setStockStatuses(buckets);
        });
        unsubs.push(unsubStock);

        setOptionsLoading(false);
      } catch {
        setOptionsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u?.());
    };
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  const FilterSelect = ({ label, value, onChange, options, loading }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 min-w-[140px]"
    >
      <option value="all">All {label}</option>
      {options.map((opt) => (
        <option key={opt.id || opt} value={opt.id || opt}>
          {opt.name || opt}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={handleSearchInput}
            placeholder="Search by name, SKU, barcode, slug, brand, category, vendor, tags, SEO..."
            className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); onSearchChange(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm font-semibold transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-white"
                : "bg-slate-100 text-primary hover:bg-slate-200"
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-4 rounded-[16px] border border-slate-200 bg-white">
              <FilterSelect
                label="Categories"
                value={filters.categoryId}
                onChange={(v) => onFiltersChange({ categoryId: v })}
                options={categories}
                loading={optionsLoading}
              />
              <FilterSelect
                label="Brands"
                value={filters.brandId}
                onChange={(v) => onFiltersChange({ brandId: v })}
                options={brands}
                loading={optionsLoading}
              />
              <FilterSelect
                label="Collections"
                value={filters.collectionId}
                onChange={(v) => onFiltersChange({ collectionId: v })}
                options={collections}
                loading={optionsLoading}
              />
              <FilterSelect
                label="Status"
                value={filters.status}
                onChange={(v) => onFiltersChange({ status: v })}
                options={productStatuses}
                loading={optionsLoading}
              />
              <FilterSelect
                label="Stock"
                value={filters.stock}
                onChange={(v) => onFiltersChange({ stock: v })}
                options={stockStatuses.map((s) => ({ id: s, name: s.charAt(0).toUpperCase() + s.slice(1) }))}
                loading={optionsLoading}
              />

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => onFiltersChange({ featured: e.target.checked })}
                  className="accent-primary"
                />
                Featured
              </label>

              <input
                value={filters.priceMin}
                onChange={(e) => onFiltersChange({ priceMin: e.target.value })}
                placeholder="Min price"
                type="number"
                className="w-24 px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                value={filters.priceMax}
                onChange={(e) => onFiltersChange({ priceMax: e.target.value })}
                placeholder="Max price"
                type="number"
                className="w-24 px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <div className="inline-flex items-center gap-1 px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700">
                <User size={14} className="text-slate-400" />
                <input
                  value={filters.vendor}
                  onChange={(e) => onFiltersChange({ vendor: e.target.value })}
                  placeholder="Vendor"
                  className="w-20 bg-transparent outline-none text-sm"
                />
              </div>

              <input
                value={filters.dateCreatedFrom}
                onChange={(e) => onFiltersChange({ dateCreatedFrom: e.target.value })}
                type="date"
                className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />
              <input
                value={filters.dateCreatedTo}
                onChange={(e) => onFiltersChange({ dateCreatedTo: e.target.value })}
                type="date"
                className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />

              <span className="text-xs text-slate-400 px-1">Updated:</span>
              <input
                value={filters.dateUpdatedFrom}
                onChange={(e) => onFiltersChange({ dateUpdatedFrom: e.target.value })}
                type="date"
                className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />
              <input
                value={filters.dateUpdatedTo}
                onChange={(e) => onFiltersChange({ dateUpdatedTo: e.target.value })}
                type="date"
                className="px-3 py-2 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchProductsPage } from "../../services/firebase/products";
import { DEFAULT_FILTERS } from "../utils/constants";

const DEBOUNCE_MS = 300;

export function useProductSearch() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const cursorRef = useRef(null);

  const searchTimerRef = useRef(null);
  const debouncedSearchRef = useRef(filters.search);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const onSearchChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      debouncedSearchRef.current = value;
      setDebouncedSearch(value);
      setPage(0);
    }, DEBOUNCE_MS);
  }, []);

  const onFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setDebouncedSearch("");
    debouncedSearchRef.current = "";
    setPage(0);
    cursorRef.current = null;
  }, []);

  const onSortChange = useCallback((key) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    const f = filters;
    if (f.categoryId !== "all") n++;
    if (f.brandId !== "all") n++;
    if (f.collectionId !== "all") n++;
    if (f.vendor) n++;
    if (f.status !== "all") n++;
    if (f.stock !== "all") n++;
    if (f.visibility !== "all") n++;
    if (f.featured) n++;
    if (f.priceMin) n++;
    if (f.priceMax) n++;
    if (f.dateCreatedFrom) n++;
    if (f.dateCreatedTo) n++;
    if (f.dateUpdatedFrom) n++;
    if (f.dateUpdatedTo) n++;
    if (debouncedSearch.trim()) n++;
    return n;
  }, [filters, debouncedSearch]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProductsPage({
        pageSize,
        cursor: cursorRef.current,
        orderField: sortBy,
        orderDir: sortDir,
        filters: {
          searchText: debouncedSearch,
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          collectionId: filters.collectionId,
          status: filters.status,
          featured: filters.featured,
          vendor: filters.vendor,
          stock: filters.stock,
          priceMin: filters.priceMin ? Number(filters.priceMin) : null,
          priceMax: filters.priceMax ? Number(filters.priceMax) : null,
          dateFrom: filters.dateCreatedFrom ? new Date(filters.dateCreatedFrom) : null,
          dateTo: filters.dateCreatedTo ? new Date(filters.dateCreatedTo) : null,
          updatedFrom: filters.dateUpdatedFrom ? new Date(filters.dateUpdatedFrom) : null,
          updatedTo: filters.dateUpdatedTo ? new Date(filters.dateUpdatedTo) : null,
        },
      });

      setAllProducts(result.items || []);
      setTotalCount(result.items?.length || 0);
    } catch (err) {
      setError(err.message || "Failed to load products");
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, sortDir, debouncedSearch, filters]);

  const goToPage = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const start = page * pageSize;
    setProducts(allProducts.slice(start, start + pageSize));
  }, [allProducts, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(allProducts.length / pageSize));

  return {
    products,
    allProducts,
    loading,
    error,
    filters,
    onSearchChange,
    onFiltersChange,
    resetFilters,
    activeFilterCount,
    sortBy,
    sortDir,
    onSortChange,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    goToPage,
    loadProducts,
  };
}

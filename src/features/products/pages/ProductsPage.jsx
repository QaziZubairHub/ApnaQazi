import { useCallback } from "react";
import { Package, RefreshCw } from "lucide-react";
import { KpiCards } from "../components/dashboard/KpiCards";
import { SearchAndFilters } from "../components/toolbar/SearchAndFilters";
import { ProductsTable } from "../components/table/ProductsTable";
import { TableToolbar } from "../components/table/TableToolbar";
import { useProductSearch } from "../hooks/useProductSearch";
import { useProductSelection } from "../hooks/useProductSelection";

export default function ProductsPage() {
  const {
    products,
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
    loadProducts,
    totalCount,
    pageSize,
    setPageSize,
    page,
    totalPages,
    goToPage,
    allProducts,
  } = useProductSearch();

  const { selectedIds, allSelected, someSelected, toggleOne, toggleAll, clearSelection } = useProductSelection(products);

  const handleRefresh = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Catalog</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-slate-500">Enterprise product management dashboard</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors self-start"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Search & Filters */}
      <SearchAndFilters
        filters={filters}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        resetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Toolbar with Bulk Actions */}
      <TableToolbar
        selectedIds={selectedIds}
        products={products}
        allProducts={allProducts}
        onRefresh={handleRefresh}
        clearSelection={clearSelection}
      />

      {/* Enterprise Table */}
      <ProductsTable
        products={products}
        loading={loading}
        error={error}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        toggleOne={toggleOne}
        toggleAll={toggleAll}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSortChange}
        onRefresh={handleRefresh}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
      />

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
        <span>
          {loading ? "Loading..." : `${totalCount || products.length} product${products.length !== 1 ? "s" : ""} found`}
        </span>
        <span className="flex items-center gap-1">
          <Package size={12} />
          Firestore sync
        </span>
      </div>
    </div>
  );
}

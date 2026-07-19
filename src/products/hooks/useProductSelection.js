import { useState, useCallback, useMemo } from "react";

export function useProductSelection(products) {
  const [selectedIds, setSelectedIds] = useState([]);

  const productIds = useMemo(() => products.map((p) => p.id), [products]);

  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleOne = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(productIds);
    }
  }, [allSelected, productIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
    clearSelection,
    selectedCount: selectedIds.length,
  };
}

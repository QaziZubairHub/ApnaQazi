import { useOrganizationItems } from "./useOrganizationItems";

export function useCategories() {
  const { items, loading, error, refresh } = useOrganizationItems("categories");
  return { categories: items, loading, error, refresh };
}

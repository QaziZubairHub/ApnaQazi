import { useOrganizationItems } from "./useOrganizationItems";

export function useBrands() {
  const { items, loading, error, refresh } = useOrganizationItems("brands");
  return { brands: items, loading, error, refresh };
}

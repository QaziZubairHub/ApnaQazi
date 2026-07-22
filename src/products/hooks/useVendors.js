import { useOrganizationItems } from "./useOrganizationItems";

export function useVendors() {
  const { items, loading, error, refresh } = useOrganizationItems("vendors");
  return { vendors: items, loading, error, refresh };
}

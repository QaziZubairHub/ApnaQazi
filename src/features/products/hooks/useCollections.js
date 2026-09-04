import { useOrganizationItems } from "./useOrganizationItems";

export function useCollections() {
  const { items, loading, error, refresh } = useOrganizationItems("collections");
  return { collections: items, loading, error, refresh };
}

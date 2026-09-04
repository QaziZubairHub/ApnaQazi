import { useState, useEffect, useCallback } from "react";
import { OrganizationService } from "../../../services/OrganizationService";

export function useOrganizationItems(collectionName, options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const { includeDeleted } = options;

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = OrganizationService.subscribeItems(collectionName, (err, data) => {
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        setItems(data);
        setLoading(false);
      }
    }, { includeDeleted });
    return unsub;
  }, [collectionName, includeDeleted, version]);

  return { items, loading, error, refresh };
}

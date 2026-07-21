import { useState, useEffect } from "react";
import { subscribeDashboardStats } from "../../services/reportService";

const INITIAL_STATS = {
  totalProducts: 0,
  publishedProducts: 0,
  draftProducts: 0,
  archivedProducts: 0,
  featuredProducts: 0,
  bestSellers: 0,
  outOfStock: 0,
  lowStock: 0,
  inventoryValue: 0,
  averagePrice: 0,
  recentlyAdded: 0,
  addedThisWeek: 0,
  addedThisMonth: 0,
};

export function useProductStats() {
  const [stats, setStats] = useState({ ...INITIAL_STATS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const unsub = subscribeDashboardStats((data) => {
        if (cancelled) return;
        setStats((prev) => ({ ...prev, ...data }));
        setLoading(false);
      });

      return () => {
        cancelled = true;
        if (unsub) unsub();
      };
    } catch (err) {
      if (!cancelled) {
        setError(err.message || "Failed to load stats");
        setLoading(false);
      }
    }
  }, []);

  return { stats, loading, error };
}

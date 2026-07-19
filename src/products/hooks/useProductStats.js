import { useState, useEffect } from "react";
import { subscribeProducts } from "../../services/firebase/products";
import { computeInventoryValue } from "../../components/Admin/ProductDashboardHelpers";

export function useProductStats() {
  const [stats, setStats] = useState({
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
    addedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub;
    let cancelled = false;

    const setup = async () => {
      try {
        setLoading(true);
        unsub = subscribeProducts((items) => {
          if (cancelled) return;

          let total = 0;
          let published = 0;
          let draft = 0;
          let archived = 0;
          let featured = 0;
          let bestSellers = 0;
          let outOfStock = 0;
          let lowStock = 0;
          let inventoryValue = 0;
          let totalPrice = 0;

          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          let addedToday = 0;
          let addedThisMonth = 0;

          for (const p of items) {
            total++;

            const status = p.status || "draft";
            if (status === "active" || status === "published") published++;
            else if (status === "draft") draft++;
            else if (status === "archived") archived++;

            if (p.featured) featured++;

            const sold = Number(p.totalSold ?? p.salesCount ?? p.sales ?? 0);
            if (sold > 0) bestSellers++;

            const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
            const lowT = Number(p.lowStockThreshold ?? p.stock?.lowStockThreshold ?? 5);
            if (qty <= 0) outOfStock++;
            else if (qty <= lowT) lowStock++;

            const price = Number(p.price ?? 0);
            const cost = Number(p.costPrice ?? p.price ?? 0);
            totalPrice += price;
            inventoryValue += cost * qty;

            const created = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || 0);
            if (created >= today) addedToday++;
            if (created >= monthStart) addedThisMonth++;
          }

          setStats({
            totalProducts: total,
            publishedProducts: published,
            draftProducts: draft,
            archivedProducts: archived,
            featuredProducts: featured,
            bestSellers,
            outOfStock,
            lowStock,
            inventoryValue,
            averagePrice: total > 0 ? Math.round(totalPrice / total) : 0,
            recentlyAdded: addedToday,
            addedThisMonth,
          });
          setLoading(false);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load stats");
          setLoading(false);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return { stats, loading, error };
}

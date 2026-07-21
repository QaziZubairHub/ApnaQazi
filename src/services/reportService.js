import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { subscribeProducts } from "./firebase/products";

const now = () => new Date();
const monthStart = () => new Date(now().getFullYear(), now().getMonth(), 1);
const todayStart = () => new Date(now().getFullYear(), now().getMonth(), now().getDate());
const weekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

const toDate = (v) => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return v;
  return null;
};

// ── Product Statistics ──────────────────────────────────────

export const computeProductStats = (products) => {
  let total = 0;
  let active = 0;
  let draft = 0;
  let archived = 0;
  let featured = 0;
  let bestSellers = 0;
  let outOfStock = 0;
  let lowStock = 0;
  let inventoryValue = 0;
  let totalPrice = 0;
  let addedToday = 0;
  let addedThisWeek = 0;
  let addedThisMonth = 0;

  const today = todayStart();
  const week = weekStart();
  const month = monthStart();

  for (const p of products) {
    total++;

    const status = p.status || "draft";
    if (status === "active" || status === "published") active++;
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

    const created = toDate(p.createdAt);
    if (created) {
      if (created >= today) addedToday++;
      if (created >= week) addedThisWeek++;
      if (created >= month) addedThisMonth++;
    }
  }

  return {
    totalProducts: total,
    publishedProducts: active,
    draftProducts: draft,
    archivedProducts: archived,
    featuredProducts: featured,
    bestSellers,
    outOfStock,
    lowStock,
    inventoryValue,
    averagePrice: total > 0 ? Math.round(totalPrice / total) : 0,
    recentlyAdded: addedToday,
    addedThisWeek,
    addedThisMonth,
  };
};

export const subscribeDashboardStats = (onData) => {
  return subscribeProducts((items) => {
    const stats = computeProductStats(items);
    onData(stats);
  });
};

// ── One-time Dashboard Overview (all collections in parallel) ──

export const getDashboardOverview = async () => {
  const [prodSnap, catSnap, brandSnap, collSnap, orderSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "categories")),
    getDocs(collection(db, "brands")),
    getDocs(collection(db, "collections")),
    getDocs(collection(db, "orders")).catch(() => ({ size: 0, docs: [], empty: true })),
  ]);

  const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const productStats = computeProductStats(products);

  const orders = orderSnap.docs ? orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
  let totalRevenue = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let salesToday = 0;
  let salesThisWeek = 0;
  let salesThisMonth = 0;

  const today = todayStart();
  const week = weekStart();
  const month = monthStart();

  for (const o of orders) {
    const total = Number(o.total ?? o.amount ?? 0);
    totalRevenue += total;

    const status = (o.status || "").toLowerCase();
    if (status === "pending" || status === "processing") pendingOrders++;
    else if (status === "delivered" || status === "completed") completedOrders++;
    else if (status === "cancelled" || status === "refunded") cancelledOrders++;

    const created = toDate(o.createdAt);
    if (created) {
      if (created >= today) salesToday += total;
      if (created >= week) salesThisWeek += total;
      if (created >= month) salesThisMonth += total;
    }
  }

  return {
    ...productStats,
    totalCategories: catSnap.size,
    totalBrands: brandSnap.size,
    totalCollections: collSnap.size,
    totalOrders: orderSnap.size,
    totalRevenue,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    salesToday,
    salesThisWeek,
    salesThisMonth,
  };
};

// ── Product Reports ──────────────────────────────────────────

export const getProductStats = async () => {
  const snap = await getDocs(collection(db, "products"));
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return computeProductStats(products);
};

export const getDraftProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => (p.status || "draft") === "draft");
};

export const getArchivedProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.status === "archived");
};

export const getFeaturedProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.featured);
};

export const getBestSellers = async (limitCount) => {
  const snap = await getDocs(collection(db, "products"));
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return products
    .filter((p) => Number(p.totalSold ?? p.salesCount ?? p.sales ?? 0) > 0)
    .sort((a, b) => (Number(b.totalSold ?? b.salesCount ?? b.sales ?? 0) - Number(a.totalSold ?? a.salesCount ?? a.sales ?? 0)))
    .slice(0, limitCount ?? 10);
};

export const getNewProducts = async (days) => {
  const d = days ?? 30;
  const cutoff = new Date(now().getTime() - d * 86400000);
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((p) => ({ id: p.id, ...p.data() }))
    .filter((p) => {
      const created = toDate(p.createdAt);
      return created && created >= cutoff;
    })
    .sort((a, b) => {
      const ca = toDate(a.createdAt);
      const cb = toDate(b.createdAt);
      return (cb?.getTime() ?? 0) - (ca?.getTime() ?? 0);
    });
};

// ── Inventory Reports ────────────────────────────────────────

export const getLowStockProducts = async (threshold) => {
  const snap = await getDocs(collection(db, "products"));
  const t = threshold ?? 5;
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => {
      const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
      const lowT = Number(p.lowStockThreshold ?? t);
      return qty > 0 && qty <= lowT;
    });
};

export const getOutOfStockProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => {
      const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
      return qty <= 0;
    });
};

export const getOverstockProducts = async (threshold) => {
  const snap = await getDocs(collection(db, "products"));
  const t = threshold ?? 100;
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => {
      const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
      return qty > t;
    })
    .sort((a, b) => (Number(b.stockQuantity ?? 0) - Number(a.stockQuantity ?? 0)));
};

export const getInventoryValue = async () => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.reduce((sum, d) => {
    const p = d.data();
    const cost = Number(p.costPrice ?? p.price ?? 0);
    const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
    return sum + cost * qty;
  }, 0);
};

export const getInventoryMovementSummary = async () => {
  const snap = await getDocs(
    query(collection(db, "inventoryLogs"), orderBy("createdAt", "desc"), limit(500))
  );
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  let totalIn = 0;
  let totalOut = 0;
  let adjustments = 0;
  const byReason = {};

  for (const log of logs) {
    const adj = Number(log.adjustment ?? 0);
    if (adj > 0) totalIn += adj;
    else if (adj < 0) totalOut += Math.abs(adj);
    else adjustments++;

    const reason = log.reason || "Unknown";
    byReason[reason] = (byReason[reason] || 0) + adj;
  }

  return { totalIn, totalOut, adjustments, netMovement: totalIn - totalOut, byReason, logCount: logs.length };
};

// ── Revenue Reports ─────────────────────────────────────────

const computeRevenue = (orders, startDate, endDate) => {
  let total = 0;
  let count = 0;
  for (const o of orders) {
    const created = toDate(o.createdAt);
    if (!created) continue;
    if (startDate && created < startDate) continue;
    if (endDate && created > endDate) continue;
    total += Number(o.total ?? o.amount ?? 0);
    count++;
  }
  return { revenue: total, orderCount: count };
};

export const getRevenueReport = async (startDate, endDate) => {
  const snap = await getDocs(collection(db, "orders")).catch(() => ({ size: 0, docs: [], empty: true }));
  if (!snap.docs) return { revenue: 0, orderCount: 0, startDate, endDate };
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { ...computeRevenue(orders, startDate, endDate), startDate, endDate };
};

export const getDailyRevenue = async (date) => {
  const d = date ? new Date(date) : new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start.getTime() + 86400000);
  return getRevenueReport(start, end);
};

export const getWeeklyRevenue = async (date) => {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + (day === 0 ? -6 : 1));
  const end = new Date(start.getTime() + 7 * 86400000);
  return getRevenueReport(start, end);
};

export const getMonthlyRevenue = async (year, month) => {
  const y = year ?? now().getFullYear();
  const m = month ?? now().getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  return getRevenueReport(start, end);
};

export const getYearlyRevenue = async (year) => {
  const y = year ?? now().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y + 1, 0, 1);
  return getRevenueReport(start, end);
};

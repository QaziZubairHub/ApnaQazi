// Shared helpers for Admin Products enterprise module

export const getStockStatus = (quantity = 0, lowStockThreshold = 5) => {
  const q = Number(quantity ?? 0);
  const t = Number(lowStockThreshold ?? 5);
  if (q <= 0) return "out";
  if (q > 0 && q <= t) return "low";
  return "in";
};

export const computeInventoryValue = (price = 0, quantity = 0) => {
  return Number(price ?? 0) * Number(quantity ?? 0);
};


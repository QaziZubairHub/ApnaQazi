import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "shopwocomm_cart";

export const FREE_SHIPPING_THRESHOLD = 10000;
export const DELIVERY_CHARGE = 250;
export const TAX_RATE = 0;

const CartContext = createContext(null);

export const beltProductToCartItem = (product, { size, qty = 1 }) => ({
  id: `${product.id}-${size}`,
  productId: product.id,
  name: product.title,
  color: `Size ${size}`,
  selectedColor: `Size ${size}`,
  brand: product.category,
  rating: product.rating,
  reviews: product.reviews,
  price: product.price,
  originalPrice: product.originalPrice,
  qty,
  image: product.image,
  inStock: true,
  delivery: "3-5 business days",
  saved: false,
  size,
  selectedSize: size,
  sku: product.sku,
  variant: `Size ${size} / ${product.sku}`,
});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + (item.qty || 1), saved: false } : p
        );
      }
      return [...prev, { ...item, qty: item.qty || 1, saved: false }];
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p
      )
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleSaveForLater = useCallback((id) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, saved: !p.saved, qty: p.saved ? p.qty : 1 } : p
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartItems = useMemo(() => items.filter((p) => !p.saved), [items]);
  const savedItems = useMemo(() => items.filter((p) => p.saved), [items]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, p) => sum + p.price * p.qty, 0),
    [cartItems]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((n, p) => n + p.qty, 0),
    [cartItems]
  );

  const savings = useMemo(
    () =>
      cartItems.reduce(
        (sum, p) => sum + (p.originalPrice - p.price) * p.qty,
        0
      ),
    [cartItems]
  );

  const getTotals = useCallback(
    (discount = 0) => {
      const afterDiscount = subtotal - discount;
      const shipping =
        afterDiscount >= FREE_SHIPPING_THRESHOLD || afterDiscount === 0
          ? 0
          : DELIVERY_CHARGE;
      const tax = afterDiscount * TAX_RATE;
      const total = afterDiscount + shipping + tax;
      return { shipping, tax, total, afterDiscount };
    },
    [subtotal]
  );

  const value = useMemo(
    () => ({
      items,
      cartItems,
      savedItems,
      subtotal,
      itemCount,
      savings,
      addToCart,
      updateQty,
      removeItem,
      toggleSaveForLater,
      clearCart,
      getTotals,
    }),
    [
      items,
      cartItems,
      savedItems,
      subtotal,
      itemCount,
      savings,
      addToCart,
      updateQty,
      removeItem,
      toggleSaveForLater,
      clearCart,
      getTotals,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};

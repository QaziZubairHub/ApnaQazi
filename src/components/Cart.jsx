import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../contexts/CartContext";
import { formatCurrency } from "../util/helpers";

const paymentMethods = [
  { id: "card", label: "Card", icon: "ri-bank-card-line" },
  { id: "paypal", label: "PayPal", icon: "ri-paypal-line" },
  { id: "cod", label: "Cash on Delivery", icon: "ri-truck-line" },
  { id: "crypto", label: "Crypto", icon: "ri-coin-line" },
];

const trustBadges = [
  { icon: "ri-shield-check-line", text: "Secure Checkout" },
  { icon: "ri-refresh-line", text: "30-Day Returns" },
  { icon: "ri-lock-2-line", text: "256-bit SSL" },
];

const formatPKR = (value) =>
  formatCurrency(value);

const Cart = () => {
  const {
    cartItems,
    savedItems,
    subtotal,
    itemCount,
    savings,
    updateQty,
    removeItem,
    toggleSaveForLater,
    clearCart,
    getTotals,
  } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) =>
    setToast({ type, message, id: Date.now() });

  const discount = appliedCoupon ? subtotal * appliedCoupon.rate : 0;
  const { shipping, tax, total } = getTotals(discount);

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const coupons = {
      SAVE10: { rate: 0.1, label: "10% OFF" },
      WELCOME: { rate: 0.15, label: "15% OFF" },
      FREESHIP: { rate: 0, label: "Free Shipping", freeShip: true },
    };
    if (coupons[code]) {
      setAppliedCoupon({ ...coupons[code], code });
      showToast("success", `Coupon "${code}" applied — ${coupons[code].label}!`);
    } else {
      setAppliedCoupon(null);
      showToast("error", "Invalid coupon code.");
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    showToast("success", "Redirecting to secure checkout…");
    setTimeout(() => navigate("/Checkout"), 800);
  };

  const handleRemove = (id) => {
    const item = cartItems.find((p) => p.id === id);
    removeItem(id);
    showToast("info", `Removed "${item?.name.split(" ").slice(0, 3).join(" ")}…"`);
  };

  /* ── Free shipping progress ── */
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* ── Toast ── */}
        {toast && (
          <div className="fixed top-5 right-5 z-[100] animate-[fadeIn_0.2s_ease-out]">
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-600"
                  : toast.type === "error"
                  ? "bg-red-500"
                  : "bg-gray-800"
              }`}
            >
              <i
                className={`text-lg ${
                  toast.type === "success"
                    ? "ri-checkbox-circle-line"
                    : toast.type === "error"
                    ? "ri-error-warning-line"
                    : "ri-information-line"
                }`}
              />
              {toast.message}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* ── Breadcrumb + Heading ── */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-[#336D6F] transition-colors">
              Home
            </Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-gray-800 font-medium">Shopping Cart</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {itemCount > 0
                  ? `${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`
                  : "Your cart is currently empty"}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#336D6F] hover:text-[#285557] transition-colors self-start sm:self-auto"
            >
              <i className="ri-arrow-left-line" />
              Continue Shopping
            </Link>
          </div>

          {/* ── Free Shipping Banner ── */}
          {cartItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 mb-6">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-[#c79864]/10 flex items-center justify-center">
                  <i className="ri-truck-line text-[#c79864] text-lg" />
                </div>
                <p className="text-sm text-gray-700">
                  {remainingForFreeShip > 0 ? (
                    <>
                      Add{" "}
                      <span className="font-bold text-[#336D6F]">
                        {formatPKR(remainingForFreeShip)}
                      </span>{" "}
                      more to unlock{" "}
                      <span className="font-semibold">FREE shipping</span>
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-600">
                      🎉 You've unlocked FREE shipping!
                    </span>
                  )}
                </p>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#c79864] to-[#336D6F] rounded-full transition-all duration-500"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Empty State ── */}
          {cartItems.length === 0 && savedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-20 px-6 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">
                <i className="ri-shopping-cart-2-line text-5xl text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Looks like you haven't added anything yet. Let's find something
                you'll love.
              </p>
              <Link
                to="/Belt"
                className="inline-flex items-center gap-2 bg-[#336D6F] hover:bg-[#285557] text-white px-7 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-[#336D6F]/20"
              >
                <i className="ri-store-2-line" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* ───────────── LEFT: Cart Items ───────────── */}
              <div className="flex-1 w-full space-y-5">
                {/* Item list card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-[1fr_140px_130px_40px] gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/60 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    <span>Product Details</span>
                    <span className="text-center">Quantity</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>

                  <div className="divide-y divide-gray-100">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_140px_130px_40px] gap-4 items-center px-5 md:px-6 py-5 hover:bg-gray-50/40 transition-colors group"
                      >
                        {/* Product Info */}
                        <div className="flex gap-4 items-center">
                          <div className="relative flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border border-gray-200 bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextSibling.style.display = "flex";
                              }}
                            />
                            <div
                              style={{ display: "none" }}
                              className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 items-center justify-center"
                            >
                              <i className="ri-image-line text-2xl text-gray-300" />
                            </div>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                -{Math.round(
                                  ((item.originalPrice - item.price) /
                                    item.originalPrice) *
                                    100
                                )}
                                %
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[#336D6F] font-semibold mb-0.5">
                              {item.brand}
                            </p>
                            <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1.5 line-clamp-2">
                              {item.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                              <span>
                                Color:{" "}
                                <span className="text-gray-700 font-medium">
                                  {item.color || item.selectedColor || "—"}
                                </span>
                              </span>
                              <span>
                                Size:{" "}
                                <span className="text-gray-700 font-medium">
                                  {item.size || item.selectedSize || "—"}
                                </span>
                              </span>
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <i className="ri-star-fill" />
                                <span className="text-gray-600 font-medium">
                                  {item.rating}
                                </span>
                                <span className="text-gray-400">
                                  ({item.reviews.toLocaleString()})
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.inStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                  <i className="ri-check-line" />
                                  In Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                  <i className="ri-time-line" />
                                  Ships in 2-3 days
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <i className="ri-truck-line" />
                                {item.delivery}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex md:justify-center">
                          <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              disabled={item.qty <= 1}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <i className="ri-subtract-line text-lg" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold text-gray-800">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <i className="ri-add-line text-lg" />
                            </button>
                          </div>
                        </div>

                        {/* Price + Total */}
                        <div className="text-left md:text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatPKR(item.price * item.qty)}
                          </p>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatPKR(item.originalPrice * item.qty)}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {formatPKR(item.price)} each
                          </p>
                        </div>

                        {/* Remove */}
                        <div className="flex md:justify-end gap-1">
                          <button
                            onClick={() => toggleSaveForLater(item.id)}
                            className="text-gray-400 hover:text-[#336D6F] hover:bg-[#336D6F]/10 rounded-lg w-9 h-9 flex items-center justify-center transition-colors md:hidden lg:inline-flex"
                            title="Save for later"
                            aria-label="Save for later"
                          >
                            <i className="ri-bookmark-line" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg w-9 h-9 flex items-center justify-center transition-colors"
                            title="Remove"
                            aria-label={`Remove ${item.name}`}
                          >
                            <i className="ri-delete-bin-line text-lg" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card footer */}
                  <div className="flex flex-col sm:flex-row gap-3 px-5 md:px-6 py-4 border-t border-gray-100 bg-gray-50/40 items-stretch sm:items-center justify-between">
                    <Link
                      to="/"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                    >
                      <i className="ri-arrow-left-line" />
                      Continue Shopping
                    </Link>
                    <div className="flex gap-3">
                      <button
                        onClick={() => showToast("info", "Cart is up to date.")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                      >
                        <i className="ri-refresh-line" />
                        Update Cart
                      </button>
                      <button
                        onClick={() => {
                          clearCart();
                          setAppliedCoupon(null);
                          showToast("info", "Cart cleared.");
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="ri-close-line" />
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved for later */}
                {savedItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                      <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i className="ri-bookmark-line text-[#c79864]" />
                        Saved for Later ({savedItems.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {savedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-6 py-4"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200 bg-gray-50"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-700 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm font-bold text-gray-900">
                              {formatPKR(item.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleSaveForLater(item.id)}
                            className="text-sm font-medium text-[#336D6F] hover:text-[#285557] px-4 py-2 rounded-lg hover:bg-[#336D6F]/10 transition-colors"
                          >
                            Move to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment icons strip */}
                <div className="flex items-center gap-4 px-2 text-xs text-gray-400">
                  <span className="font-medium">We accept:</span>
                  <div className="flex items-center gap-3 text-xl">
                    <i className="ri-visa-line" />
                    <i className="ri-mastercard-line" />
                    <i className="ri-paypal-line" />
                    <i className="ri-bank-card-line" />
                  </div>
                </div>
              </div>

              {/* ───────────── RIGHT: Order Summary ───────────── */}
              <div className="w-full lg:w-[360px] lg:sticky lg:top-24 space-y-5">
                {/* Promo code */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i className="ri-coupon-3-line text-[#c79864]" />
                    Promo Code
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <i className="ri-checkbox-circle-fill text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-emerald-600">
                            {appliedCoupon.label} applied
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCoupon("");
                          showToast("info", "Coupon removed.");
                        }}
                        className="text-emerald-600 hover:text-red-500 transition-colors"
                        aria-label="Remove coupon"
                      >
                        <i className="ri-close-line text-lg" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code (SAVE10)"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#336D6F] focus:ring-2 focus:ring-[#336D6F]/10 transition"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">
                    Try: <span className="font-semibold text-gray-500">SAVE10</span>,{" "}
                    <span className="font-semibold text-gray-500">WELCOME</span>
                  </p>
                </div>

                {/* Order summary */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-base font-bold text-gray-800 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="text-gray-800 font-medium">
                        {formatPKR(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">−{formatPKR(discount)}</span>
                      </div>
                    )}
                    {savings > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Product Savings</span>
                        <span className="font-medium">−{formatPKR(savings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery</span>
                      <span className="text-gray-800 font-medium">
                        {shipping === 0 ? (
                          <span className="text-emerald-600 font-semibold">FREE</span>
                        ) : (
                          formatPKR(shipping)
                        )}
                      </span>
                    </div>
                    {tax > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Estimated Tax</span>
                      <span className="text-gray-800 font-medium">
                        {formatPKR(tax)}
                      </span>
                    </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPKR(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          selectedPayment === method.id
                            ? "border-[#336D6F] bg-[#336D6F]/5 text-[#336D6F] ring-1 ring-[#336D6F]/20"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <i className={`${method.icon} text-base`} />
                        {method.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#336D6F] hover:bg-[#285557] text-white rounded-xl py-3.5 text-sm font-bold transition-colors shadow-lg shadow-[#336D6F]/25 flex items-center justify-center gap-2"
                  >
                    <i className="ri-lock-2-line" />
                    Proceed to Checkout
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    By placing your order, you agree to our Terms & Privacy Policy
                  </p>
                </div>

                {/* Trust badges */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {trustBadges.map((badge) => (
                      <div key={badge.text} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-[#336D6F]/10 flex items-center justify-center">
                          <i className={`${badge.icon} text-[#336D6F] text-lg`} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 leading-tight">
                          {badge.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Cart;

// ─── Utility helpers ───────────────────────────────────────────
// Shared parsing and formatting functions used across admin pages

export const parseNumber = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (value?.toNumber) return value.toNumber();
  if (typeof value === "string") return Number(value.replace(/[^0-9.-]+/g, "")) || 0;
  return 0;
};

export const parseDateValue = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value instanceof Date) return value;
  return null;
};

export const formatCurrency = (value) => {
  const num = parseNumber(value);
  return `Rs ${num.toLocaleString()}`;
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name = "") => {
  const colors = [
    "#5B3DF5", "#06B6D4", "#10B981", "#F59E0B",
    "#EF4444", "#7C4DFF", "#EC4899", "#EA580C",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── Image helpers (handles legacy string[] and new object[] formats) ───

// Extract a URL string from an image entry that may be a string or {url, ...}
export const getImageUrl = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img?.url) return img.url;
  return "";
};

// Normalize an images array to always be [{id, url, order, isFeatured}, ...]
export const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map((img, i) => {
    if (typeof img === "string") {
      return { id: `img_${Date.now()}_${i}`, url: img, order: i, isFeatured: i === 0 };
    }
    return {
      id: img.id || `img_${Date.now()}_${i}`,
      url: img.url || "",
      order: typeof img.order === "number" ? img.order : i,
      isFeatured: img.isFeatured === true || (typeof img.order !== "number" && i === 0),
    };
  }).filter((img) => img.url);
};

export const truncateId = (id, len = 8) => {
  if (!id) return "—";
  return `#${id.slice(0, len).toUpperCase()}`;
};

export const getStatusColor = (status = "") => {
  const s = status.toLowerCase();
  if (s === "delivered") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };
  if (s === "pending") return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
  if (s === "processing") return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" };
  if (s === "shipped") return { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" };
  if (s === "packed") return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" };
  if (s === "cancelled") return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
  if (s === "active") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };
  if (s === "blocked" || s === "deactive") return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
  return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" };
};

export const timeAgo = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// ─── Invoice / PDF helpers ──────────────────────────────────────

// Friendly date string (e.g. "Jun 26, 2026") for Firestore Timestamps / Date / string
export const formatDate = (value) => {
  const d = parseDateValue(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (value) => {
  const d = parseDateValue(value);
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// URL-friendly slug
export const genSlug = (s = "") =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Email validator
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

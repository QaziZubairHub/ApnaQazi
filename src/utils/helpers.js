export const formatCurrency = (value, currency = 'USD') => {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
};

export const truncateId = (id, len = 8) => {
  if (!id) return '—';
  return `#${id.slice(0, len).toUpperCase()}`;
};

export const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const formatDate = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

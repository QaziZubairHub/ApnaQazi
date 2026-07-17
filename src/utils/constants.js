export const SETTINGS_SECTIONS = [
  'general',
  'store',
  'payment',
  'shipping',
  'email',
  'whatsapp',
  'firebase',
  'notifications',
  'invoice',
  'seo',
  'appearance',
  'security',
  'users-roles',
  'analytics',
  'backup-restore',
  'api',
  'activity-logs',
  'system-health',
  'developer',
];

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED'];

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'];

export const PRICE_ALERT_THRESHOLD = Number(process.env.PRICE_ALERT_THRESHOLD || "5");
export const MAX_FAILED_LOGIN_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || "5");
export const LOCKOUT_DURATION_MINUTES = Number(process.env.LOCKOUT_DURATION_MINUTES || "30");
export const WATCHER_DEFAULT_INTERVAL = Number(process.env.WATCHER_DEFAULT_INTERVAL || "60");
export const WATCHER_CONCURRENCY = Number(process.env.WATCHER_CONCURRENCY || "5");

export const SUBSCRIPTION_LIMITS = {
  FREE: { maxStores: 1, maxProducts: 100 },
  STARTER: { maxStores: 3, maxProducts: 1000 },
  PRO: { maxStores: 10, maxProducts: 10000 },
  ENTERPRISE: { maxStores: 50, maxProducts: 100000 },
} as const;

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PRICE_ALERT", "STOCK_ALERT", "APPROVED", "CANCELLED"],
  PRICE_ALERT: ["APPROVED", "CANCELLED"],
  STOCK_ALERT: ["APPROVED", "CANCELLED"],
  APPROVED: ["PLACED", "FAILED", "CANCELLED"],
  PLACED: ["SHIPPED", "FAILED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "FAILED"],
  DELIVERED: ["REFUNDED"],
  FAILED: ["PENDING"],
  CANCELLED: [],
  REFUNDED: [],
};

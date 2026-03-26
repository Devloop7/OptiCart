export interface DashboardStats {
  totalProfit: number;
  activeListings: number;
  ordersToday: number;
  watcherStats: { active: number; paused: number; error: number };
  profitTrend: number;
  listingsTrend: number;
  ordersTrend: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  details: string;
  severity: string;
  createdAt: Date;
}

export interface StoreHealth {
  storeId: string;
  storeName: string;
  storeType: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  productCount: number;
}

import { db } from "@/lib/db";
import type { DashboardStats, ActivityItem, StoreHealth } from "@/types/dashboard";

export class AnalyticsService {

  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalProfitResult,
      activeListings,
      ordersToday,
      ordersYesterday,
      watcherActive,
      watcherPaused,
      watcherError,
      listingsYesterday,
    ] = await Promise.all([
      db.automatedOrder.aggregate({
        where: { store: { userId }, status: "DELIVERED" },
        _sum: { profit: true },
      }),
      db.product.count({ where: { store: { userId }, status: "ACTIVE" } }),
      db.automatedOrder.count({ where: { store: { userId }, createdAt: { gte: startOfToday } } }),
      db.automatedOrder.count({
        where: { store: { userId }, createdAt: { gte: startOfYesterday, lt: startOfToday } },
      }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "ACTIVE" } }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "PAUSED" } }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "ERROR" } }),
      db.product.count({
        where: { store: { userId }, status: "ACTIVE", createdAt: { lt: startOfToday } },
      }),
    ]);

    const totalProfit = Number(totalProfitResult._sum.profit || 0);
    const ordersTrend = ordersYesterday > 0
      ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100
      : ordersToday > 0 ? 100 : 0;
    const listingsTrend = listingsYesterday > 0
      ? ((activeListings - listingsYesterday) / listingsYesterday) * 100
      : 0;

    return {
      totalProfit,
      activeListings,
      ordersToday,
      watcherStats: { active: watcherActive, paused: watcherPaused, error: watcherError },
      profitTrend: 0,
      listingsTrend,
      ordersTrend,
    };
  }

  static async getRecentActivity(userId: string, limit = 20): Promise<ActivityItem[]> {
    const activities = await db.activityLog.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      action: a.action,
      details: a.details || "",
      severity: a.severity,
      createdAt: a.createdAt,
    }));
  }

  static async getStoreHealth(userId: string): Promise<StoreHealth[]> {
    const stores = await db.store.findMany({
      where: { userId },
      include: { _count: { select: { products: true } } },
    });

    return stores.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      storeType: s.storeType,
      isActive: s.isActive,
      lastSyncAt: s.lastSyncAt,
      productCount: s._count.products,
    }));
  }
}

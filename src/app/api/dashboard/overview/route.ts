import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // Get the first user (demo mode — in production this would use the session)
    const user = await db.user.findFirst();
    if (!user) {
      return success({
        stats: null,
        stores: [],
        activities: [],
      });
    }

    const userId = user.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalProfitResult,
      activeListings,
      ordersToday,
      watcherActive,
      watcherPaused,
      watcherError,
      stores,
      activities,
    ] = await Promise.all([
      db.automatedOrder.aggregate({
        where: { store: { userId }, status: "DELIVERED" },
        _sum: { profit: true },
      }),
      db.product.count({ where: { store: { userId }, status: "ACTIVE" } }),
      db.automatedOrder.count({ where: { store: { userId }, createdAt: { gte: startOfToday } } }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "ACTIVE" } }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "PAUSED" } }),
      db.watcherTask.count({ where: { product: { store: { userId } }, status: "ERROR" } }),
      db.store.findMany({
        where: { userId },
        include: { _count: { select: { products: true } } },
      }),
      db.activityLog.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return success({
      stats: {
        totalProfit: Number(totalProfitResult._sum.profit || 0),
        activeListings,
        ordersToday,
        ordersTrend: ordersToday > 0 ? 100 : 0,
        listingsTrend: 0,
        watcherStats: { active: watcherActive, paused: watcherPaused, error: watcherError },
      },
      stores: stores.map((s) => ({
        storeId: s.id,
        storeName: s.name,
        storeType: s.storeType,
        isActive: s.isActive,
        lastSyncAt: s.lastSyncAt,
        productCount: s._count.products,
      })),
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        details: a.details || "",
        severity: a.severity,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

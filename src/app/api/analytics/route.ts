import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) return success(null);

    const userId = user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      totalRevenue,
      totalProfit,
      totalOrders,
      deliveredOrders,
      recentOrders,
      topProducts,
      storePerformance,
      ordersByStatus,
    ] = await Promise.all([
      db.automatedOrder.aggregate({
        where: { store: { userId } },
        _sum: { sellingPrice: true },
      }),
      db.automatedOrder.aggregate({
        where: { store: { userId }, status: "DELIVERED" },
        _sum: { profit: true },
      }),
      db.automatedOrder.count({ where: { store: { userId } } }),
      db.automatedOrder.count({ where: { store: { userId }, status: "DELIVERED" } }),
      db.automatedOrder.findMany({
        where: { store: { userId }, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, profit: true, sellingPrice: true, supplierCost: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      db.automatedOrder.groupBy({
        by: ["productId"],
        where: { store: { userId }, status: "DELIVERED" },
        _sum: { profit: true, sellingPrice: true },
        _count: true,
        orderBy: { _sum: { profit: "desc" } },
        take: 5,
      }),
      db.store.findMany({
        where: { userId },
        include: {
          _count: { select: { products: true, automatedOrders: true } },
          automatedOrders: {
            where: { status: "DELIVERED" },
            select: { profit: true },
          },
        },
      }),
      db.automatedOrder.groupBy({
        by: ["status"],
        where: { store: { userId } },
        _count: true,
      }),
    ]);

    // Get product titles for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p.title]));

    // Build daily revenue chart data (last 30 days)
    const dailyData: Record<string, { revenue: number; profit: number; orders: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { revenue: 0, profit: 0, orders: 0 };
    }
    for (const order of recentOrders) {
      const key = order.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].revenue += Number(order.sellingPrice);
        dailyData[key].profit += Number(order.profit);
        dailyData[key].orders += 1;
      }
    }

    return success({
      overview: {
        totalRevenue: Number(totalRevenue._sum.sellingPrice || 0),
        totalProfit: Number(totalProfit._sum.profit || 0),
        totalOrders,
        deliveredOrders,
        avgOrderValue: totalOrders > 0 ? Number(totalRevenue._sum.sellingPrice || 0) / totalOrders : 0,
        fulfillmentRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      },
      dailyChart: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        title: productMap[p.productId] || "Unknown",
        orders: p._count,
        revenue: Number(p._sum.sellingPrice || 0),
        profit: Number(p._sum.profit || 0),
      })),
      storePerformance: storePerformance.map((s) => ({
        storeId: s.id,
        name: s.name,
        storeType: s.storeType,
        products: s._count.products,
        orders: s._count.automatedOrders,
        profit: s.automatedOrders.reduce((sum, o) => sum + Number(o.profit), 0),
      })),
      ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

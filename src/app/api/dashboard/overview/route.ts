import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const wId = workspace.id;

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      newOrders,
      revenueAgg,
      profitAgg,
      recentOrders,
      storesCount,
    ] = await Promise.all([
      db.product.count({ where: { workspaceId: wId } }),
      db.product.count({ where: { workspaceId: wId, status: "ACTIVE" } }),
      db.storeOrder.count({ where: { workspaceId: wId } }),
      db.storeOrder.count({ where: { workspaceId: wId, status: "NEW" } }),
      db.storeOrder.aggregate({
        where: { workspaceId: wId },
        _sum: { totalAmount: true },
      }),
      db.storeOrder.aggregate({
        where: { workspaceId: wId },
        _sum: { totalProfit: true },
      }),
      db.storeOrder.findMany({
        where: { workspaceId: wId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: { include: { product: { select: { title: true } } } },
          store: { select: { name: true } },
        },
      }),
      db.store.count({ where: { workspaceId: wId } }),
    ]);

    return success({
      totalProducts,
      activeProducts,
      totalOrders,
      newOrders,
      revenue: revenueAgg._sum.totalAmount ?? 0,
      profit: profitAgg._sum.totalProfit ?? 0,
      recentOrders,
      storesCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

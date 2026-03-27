import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await getWorkspace();

    // Get current subscription with plan
    const subscription = await db.subscription.findUnique({
      where: { workspaceId: workspace.id },
      include: { plan: true },
    });

    // Get all plans for comparison
    const plans = await db.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
    });

    // Get current month usage
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = await db.usageRecord.findUnique({
      where: { workspaceId_month: { workspaceId: workspace.id, month } },
    });

    // If no usage record, count from actual data
    const productCount = usage?.products ?? await db.product.count({
      where: { workspaceId: workspace.id },
    });
    const orderCount = usage?.orders ?? await db.storeOrder.count({
      where: { workspaceId: workspace.id, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    });

    const currentPlan = subscription?.plan ?? null;

    const serializedPlans = plans.map((p) => ({
      tier: p.tier,
      name: p.name,
      monthlyPrice: Number(p.monthlyPrice),
      maxProducts: p.maxProducts,
      maxOrdersMonth: p.maxOrdersMonth,
      maxStores: p.maxStores,
      maxAiRequests: p.maxAiRequests,
      features: Array.isArray(p.features) ? p.features : [],
    }));

    return success({
      currentPlan: currentPlan
        ? {
            tier: currentPlan.tier,
            name: currentPlan.name,
            monthlyPrice: Number(currentPlan.monthlyPrice),
            maxProducts: currentPlan.maxProducts,
            maxOrdersMonth: currentPlan.maxOrdersMonth,
            maxStores: currentPlan.maxStores,
            maxAiRequests: currentPlan.maxAiRequests,
            features: Array.isArray(currentPlan.features) ? currentPlan.features : [],
          }
        : null,
      usage: {
        products: productCount,
        orders: orderCount,
        aiRequests: usage?.aiRequests ?? 0,
      },
      plans: serializedPlans,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

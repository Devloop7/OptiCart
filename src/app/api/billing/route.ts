import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const subscription = await db.subscription.findUnique({
      where: { workspaceId: workspace.id },
      include: { plan: true },
    });

    if (!subscription) {
      return success({
        subscription: null,
        plan: null,
        usage: null,
        limits: null,
      });
    }

    // Get current month usage
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const usage = await db.usageRecord.findUnique({
      where: {
        workspaceId_month: {
          workspaceId: workspace.id,
          month,
        },
      },
    });

    const plan = subscription.plan;

    return success({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan: {
        id: plan.id,
        tier: plan.tier,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        features: plan.features,
      },
      usage: {
        products: usage?.products ?? 0,
        orders: usage?.orders ?? 0,
        aiRequests: usage?.aiRequests ?? 0,
      },
      limits: {
        maxProducts: plan.maxProducts,
        maxOrdersMonth: plan.maxOrdersMonth,
        maxStores: plan.maxStores,
        maxAiRequests: plan.maxAiRequests,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

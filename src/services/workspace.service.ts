import { db } from "@/lib/db";

/**
 * Creates a default workspace with membership, free subscription,
 * default supplier, and default pricing rule — all in a single transaction.
 */
export async function createDefaultWorkspace(
  userId: string,
  userName: string | null,
  email: string | null
) {
  const slug =
    (email?.split("@")[0] || "user")
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30) +
    "-" +
    Date.now().toString(36);

  return db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: `${userName || "My"}'s Workspace`,
        slug,
      },
    });

    await tx.membership.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    const freePlan = await tx.plan.findUnique({ where: { tier: "FREE" } });
    if (freePlan) {
      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
        },
      });
    }

    await tx.workspaceSupplier.create({
      data: {
        workspaceId: workspace.id,
        platform: "ALIEXPRESS",
        name: "AliExpress",
        isActive: true,
      },
    });

    await tx.pricingRule.create({
      data: {
        workspaceId: workspace.id,
        name: "Default 2x Markup",
        multiplier: 2.0,
        fixedAddon: 0,
        minMarginPct: 20,
        isDefault: true,
      },
    });

    return workspace;
  });
}

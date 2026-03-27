import { NextRequest } from "next/server";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return error("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user + workspace + membership + free subscription in one go
    const user = await db.user.create({
      data: {
        name: body.name,
        email,
        hashedPassword,
      },
    });

    const slug = email.split("@")[0].replace(/[^a-z0-9]/g, "-").slice(0, 30) + "-" + Date.now().toString(36);

    const workspace = await db.workspace.create({
      data: {
        name: `${body.name}'s Workspace`,
        slug,
      },
    });

    await db.membership.create({
      data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
    });

    // Assign free plan
    const freePlan = await db.plan.findUnique({ where: { tier: "FREE" } });
    if (freePlan) {
      await db.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
        },
      });
    }

    // Create default AliExpress supplier
    await db.workspaceSupplier.create({
      data: {
        workspaceId: workspace.id,
        platform: "ALIEXPRESS",
        name: "AliExpress",
        isActive: true,
      },
    });

    // Create default pricing rule
    await db.pricingRule.create({
      data: {
        workspaceId: workspace.id,
        name: "Default 2x Markup",
        multiplier: 2.0,
        fixedAddon: 0,
        minMarginPct: 20,
        isDefault: true,
      },
    });

    return success({
      id: user.id,
      name: user.name,
      email: user.email,
      workspaceId: workspace.id,
    }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

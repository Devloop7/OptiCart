import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const createRuleSchema = z.object({
  type: z.enum(["STOCK_SYNC", "PRICE_SYNC"]),
  name: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  frequencyMinutes: z.number().int().min(5).optional().default(60),
});

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const rules = await db.automationRule.findMany({
      where: { workspaceId: workspace.id },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(rules);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = createRuleSchema.parse(body);

    const rule = await db.automationRule.create({
      data: {
        workspaceId: workspace.id,
        type: data.type,
        name: data.name,
        config: data.config as Prisma.InputJsonValue,
        frequencyMinutes: data.frequencyMinutes,
        nextRunAt: new Date(Date.now() + data.frequencyMinutes * 60 * 1000),
      },
    });

    return success(rule, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

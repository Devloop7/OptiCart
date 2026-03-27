import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const createRuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["STOCK_SYNC", "PRICE_SYNC"]),
  frequencyMinutes: z.number().int().min(1).optional().default(60),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function GET() {
  try {
    const { workspace } = await getWorkspace();

    const rules = await db.automationRule.findMany({
      where: { workspaceId: workspace.id },
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
        name: data.name,
        type: data.type,
        frequencyMinutes: data.frequencyMinutes,
        config: data.config as Parameters<typeof db.automationRule.create>[0]["data"]["config"],
      },
    });

    return success(rule, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

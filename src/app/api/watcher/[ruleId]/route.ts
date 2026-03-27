import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ruleId: string }> };

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  frequencyMinutes: z.number().int().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { ruleId } = await params;

    const existing = await db.automationRule.findFirst({
      where: { id: ruleId, workspaceId: workspace.id },
    });
    if (!existing) return error("Rule not found", 404);

    const body = await req.json();
    const { config, ...rest } = updateRuleSchema.parse(body);

    const rule = await db.automationRule.update({
      where: { id: ruleId },
      data: {
        ...rest,
        ...(config !== undefined && { config: config as Parameters<typeof db.automationRule.update>[0]["data"]["config"] }),
      },
    });

    return success(rule);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { ruleId } = await params;

    const existing = await db.automationRule.findFirst({
      where: { id: ruleId, workspaceId: workspace.id },
    });
    if (!existing) return error("Rule not found", 404);

    await db.automationRule.delete({ where: { id: ruleId } });
    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

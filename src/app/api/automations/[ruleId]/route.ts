import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ruleId: string }> };

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  frequencyMinutes: z.number().int().min(5).optional(),
});

async function findRule(workspaceId: string, ruleId: string) {
  return db.automationRule.findFirst({
    where: { id: ruleId, workspaceId },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { ruleId } = await params;

    const rule = await db.automationRule.findFirst({
      where: { id: ruleId, workspaceId: workspace.id },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!rule) return error("Automation rule not found", 404);
    return success(rule);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { ruleId } = await params;

    const existing = await findRule(workspace.id, ruleId);
    if (!existing) return error("Automation rule not found", 404);

    const body = await req.json();
    const data = updateRuleSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.config !== undefined) updateData.config = data.config as Prisma.InputJsonValue;
    if (data.frequencyMinutes !== undefined) {
      updateData.frequencyMinutes = data.frequencyMinutes;
      updateData.nextRunAt = new Date(
        Date.now() + data.frequencyMinutes * 60 * 1000
      );
    }

    const rule = await db.automationRule.update({
      where: { id: ruleId },
      data: updateData,
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

    const existing = await findRule(workspace.id, ruleId);
    if (!existing) return error("Automation rule not found", 404);

    await db.automationRule.delete({ where: { id: ruleId } });
    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

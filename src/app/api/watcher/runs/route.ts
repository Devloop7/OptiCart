import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await getWorkspace();

    const runs = await db.automationRun.findMany({
      where: {
        rule: { workspaceId: workspace.id },
      },
      include: {
        rule: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    // Map to match the UI interface
    const serialized = runs.map((run) => ({
      id: run.id,
      ruleId: run.ruleId,
      ruleName: run.rule.name,
      status: run.status,
      summary: run.errorMessage
        ? run.errorMessage
        : `Checked ${run.itemsChecked}, updated ${run.itemsUpdated}`,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
    }));

    return success(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}

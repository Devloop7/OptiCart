import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const body = await req.json();

    const task = await db.watcherTask.findUnique({ where: { id: taskId } });
    if (!task) return error("Watcher task not found", 404);

    const updated = await db.watcherTask.update({
      where: { id: taskId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.intervalMinutes && { intervalMinutes: body.intervalMinutes }),
        ...(body.status === "ACTIVE" && { consecutiveFails: 0, lastError: null }),
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

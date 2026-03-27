import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  action: z.enum(["activate", "pause"]),
  ids: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const { action, ids } = bulkSchema.parse(body);

    const status = action === "activate" ? "ACTIVE" : "PAUSED";

    const result = await db.product.updateMany({
      where: {
        id: { in: ids },
        workspaceId: workspace.id,
      },
      data: { status },
    });

    return success({ updated: result.count });
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().min(1).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const full = await db.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        subscription: { include: { plan: true } },
      },
    });

    return success(full);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = updateWorkspaceSchema.parse(body);

    const updated = await db.workspace.update({
      where: { id: workspace.id },
      data,
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

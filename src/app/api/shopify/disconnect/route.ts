import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return error("Store ID is required", 400);
    }

    const store = await db.store.findFirst({
      where: { id: storeId, workspaceId: workspace.id },
    });

    if (!store) {
      return error("Store not found", 404);
    }

    await db.store.update({
      where: { id: storeId },
      data: {
        isActive: false,
        accessToken: null,
        settings: { disconnectedAt: new Date().toISOString() },
      },
    });

    return success({ disconnected: true });
  } catch (err) {
    return handleApiError(err);
  }
}

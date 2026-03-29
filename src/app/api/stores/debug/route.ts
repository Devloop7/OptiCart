import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const stores = await db.store.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        platform: true,
        domain: true,
        isActive: true,
        accessToken: true,
        lastSyncAt: true,
        createdAt: true,
        settings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return success(
      stores.map((s) => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        domain: s.domain,
        isActive: s.isActive,
        hasToken: !!s.accessToken,
        tokenPrefix: s.accessToken ? s.accessToken.slice(0, 10) + "..." : null,
        lastSyncAt: s.lastSyncAt,
        createdAt: s.createdAt,
        settings: s.settings,
      }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

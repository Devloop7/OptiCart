import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

export const dynamic = "force-dynamic";

/** Delete all stores without access tokens and dedup stores by domain */
export async function POST(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    // Get all stores for this workspace
    const stores = await db.store.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    const deleted: string[] = [];
    const kept: string[] = [];
    const seenDomains = new Set<string>();

    for (const store of stores) {
      const domain = store.domain || "";

      // Delete if: no token, OR duplicate domain (keep newest with token)
      if (!store.accessToken || !store.isActive) {
        await db.store.delete({ where: { id: store.id } }).catch(() => {});
        deleted.push(`${store.name} (${domain}) - no token`);
      } else if (seenDomains.has(domain)) {
        await db.store.delete({ where: { id: store.id } }).catch(() => {});
        deleted.push(`${store.name} (${domain}) - duplicate`);
      } else {
        seenDomains.add(domain);
        kept.push(`${store.name} (${domain}) - active with token`);
      }
    }

    return success({ deleted, kept, totalDeleted: deleted.length, totalKept: kept.length });
  } catch (err) {
    return handleApiError(err);
  }
}

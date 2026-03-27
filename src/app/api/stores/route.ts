import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const createStoreSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(["SHOPIFY", "WOOCOMMERCE", "EBAY", "TIKTOK_SHOP"]),
  domain: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const stores = await db.store.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: {
          select: {
            storeLinks: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(stores);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = createStoreSchema.parse(body);

    const store = await db.store.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        platform: data.platform,
        domain: data.domain,
      },
    });

    return success(store, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

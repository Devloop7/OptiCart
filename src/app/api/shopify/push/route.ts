import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { getWorkspace } from "@/lib/get-user";
import { pushProductToShopify } from "@/services/shopify.service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const { productId, storeId } = body;

    if (!productId || !storeId) {
      return error("Product ID and Store ID are required", 400);
    }

    // Verify product belongs to workspace
    const product = await db.product.findFirst({
      where: { id: productId, workspaceId: workspace.id },
      select: { id: true },
    });
    if (!product) return error("Product not found", 404);

    // Verify store belongs to workspace and is active
    const store = await db.store.findFirst({
      where: { id: storeId, workspaceId: workspace.id, isActive: true },
      select: { id: true },
    });
    if (!store) {
      // Fall back to any active Shopify store
      const fallback = await db.store.findFirst({
        where: { workspaceId: workspace.id, isActive: true, platform: "SHOPIFY", accessToken: { not: null } },
        orderBy: { lastSyncAt: "desc" },
        select: { id: true },
      });
      if (!fallback) {
        return error("No connected store found. Please connect your Shopify store first.", 404);
      }
      const result = await pushProductToShopify(fallback.id, productId);
      if (!result.success) {
        const status = result.error?.includes("expired") ? 401 : 400;
        return error(result.error!, status);
      }
      return success({
        pushed: true,
        shopifyProductId: result.shopifyProductId,
      });
    }

    const result = await pushProductToShopify(store.id, productId);
    if (!result.success) {
      const status = result.error?.includes("expired") ? 401 : 400;
      return error(result.error!, status);
    }

    return success({
      pushed: true,
      shopifyProductId: result.shopifyProductId,
    });
  } catch (err) {
    console.error("[Shopify Push] Error:", err);
    return handleApiError(err);
  }
}

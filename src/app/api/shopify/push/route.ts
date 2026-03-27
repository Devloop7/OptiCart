import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { pushProductToShopify } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const { productId, storeId } = body;

    if (!productId || !storeId) {
      return error("Product ID and Store ID are required", 400);
    }

    // Get the product with variants
    const product = await db.product.findFirst({
      where: { id: productId, workspaceId: workspace.id },
      include: {
        variants: true,
        supplierProduct: true,
      },
    });

    if (!product) return error("Product not found", 404);

    // Get the store
    const store = await db.store.findFirst({
      where: { id: storeId, workspaceId: workspace.id, isActive: true },
    });

    if (!store) return error("Store not found or not connected", 404);
    if (!store.accessToken) return error("Store has no access token. Please reconnect.", 400);
    if (!store.domain) return error("Store has no domain configured", 400);

    // Push to Shopify
    const images = Array.isArray(product.images)
      ? (product.images as string[]).map((src) => ({ src }))
      : [];

    const variants = product.variants.map((v) => ({
      price: v.retailPrice.toString(),
      sku: v.sku || undefined,
      inventory_quantity: v.stock,
      option1: v.name,
    }));

    const shopifyProduct = await pushProductToShopify(
      store.domain,
      store.accessToken,
      {
        title: product.title,
        body_html: product.description || "",
        vendor: "OptiCart",
        product_type: product.category || "General",
        images: images.slice(0, 10),
        variants: variants.length > 0 ? variants : undefined,
      }
    );

    // Create/update store link
    const externalId = shopifyProduct?.product?.id?.toString();
    await db.productStoreLink.upsert({
      where: {
        productId_storeId: { productId: product.id, storeId: store.id },
      },
      create: {
        productId: product.id,
        storeId: store.id,
        externalProductId: externalId,
        externalUrl: externalId
          ? `https://${store.domain}/admin/products/${externalId}`
          : null,
        isPushed: true,
        lastPushedAt: new Date(),
      },
      update: {
        externalProductId: externalId,
        externalUrl: externalId
          ? `https://${store.domain}/admin/products/${externalId}`
          : null,
        isPushed: true,
        lastPushedAt: new Date(),
      },
    });

    // Update store sync time
    await db.store.update({
      where: { id: store.id },
      data: { lastSyncAt: new Date() },
    });

    return success({
      pushed: true,
      shopifyProductId: externalId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

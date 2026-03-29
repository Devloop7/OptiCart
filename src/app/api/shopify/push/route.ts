import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";

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
    if (!store.accessToken) {
      return error("Store has no access token. Please disconnect and reconnect your store.", 400);
    }
    if (!store.domain) return error("Store has no domain configured", 400);

    // Build the Shopify product payload
    const images = Array.isArray(product.images)
      ? (product.images as string[])
          .filter((src) => typeof src === "string" && src.length > 0)
          .map((src) => {
            // Fix protocol-relative URLs
            let url = src;
            if (url.startsWith("//")) url = `https:${url}`;
            return { src: url };
          })
          .slice(0, 10)
      : [];

    const variants = product.variants.map((v) => ({
      price: String(Number(v.retailPrice) || 0),
      sku: v.sku || undefined,
      inventory_quantity: v.stock,
      option1: v.name,
      inventory_management: "shopify",
    }));

    const shopifyPayload = {
      product: {
        title: product.title,
        body_html: product.description || "",
        vendor: "OptiCart",
        product_type: product.category || "General",
        status: "draft",
        images: images.length > 0 ? images : undefined,
        variants: variants.length > 0 ? variants : undefined,
      },
    };

    // Push to Shopify
    const cleanDomain = store.domain.replace(/https?:\/\//, "").replace(/\/$/, "");
    const apiUrl = `https://${cleanDomain}/admin/api/2024-10/products.json`;

    console.log(`[Shopify Push] Pushing "${product.title}" to ${cleanDomain}`);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": store.accessToken,
      },
      body: JSON.stringify(shopifyPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Shopify Push] API error ${res.status}:`, text.slice(0, 500));

      if (res.status === 401 || res.status === 403) {
        // Token is invalid - mark store for reconnection
        await db.store.update({
          where: { id: store.id },
          data: { isActive: false },
        });
        return error(
          "Shopify access expired. Please disconnect and reconnect your store from the Stores page.",
          401
        );
      }

      return error(
        `Shopify error (${res.status}): ${text.slice(0, 200)}`,
        400
      );
    }

    const shopifyResponse = await res.json();
    const shopifyProduct = shopifyResponse.product;
    const externalId = shopifyProduct?.id?.toString();

    console.log(`[Shopify Push] Success! Product ID: ${externalId}`);

    // Create/update store link
    await db.productStoreLink.upsert({
      where: {
        productId_storeId: { productId: product.id, storeId: store.id },
      },
      create: {
        productId: product.id,
        storeId: store.id,
        externalProductId: externalId,
        externalUrl: externalId
          ? `https://${cleanDomain}/admin/products/${externalId}`
          : null,
        isPushed: true,
        lastPushedAt: new Date(),
      },
      update: {
        externalProductId: externalId,
        externalUrl: externalId
          ? `https://${cleanDomain}/admin/products/${externalId}`
          : null,
        isPushed: true,
        lastPushedAt: new Date(),
      },
    });

    await db.store.update({
      where: { id: store.id },
      data: { lastSyncAt: new Date() },
    });

    return success({
      pushed: true,
      shopifyProductId: externalId,
      shopifyUrl: externalId
        ? `https://${cleanDomain}/admin/products/${externalId}`
        : null,
    });
  } catch (err) {
    console.error("[Shopify Push] Error:", err);
    return handleApiError(err);
  }
}

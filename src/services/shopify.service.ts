import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { exchangeCodeForToken as exchangeCode } from "@/lib/shopify";

// ---------------------------------------------------------------------------
// Token encryption helpers
// ---------------------------------------------------------------------------

export function encryptToken(token: string): string {
  if (!process.env.VAULT_ENCRYPTION_KEY) {
    // Dev mode — store as-is
    return token;
  }
  const result = encrypt(token);
  return JSON.stringify(result);
}

export function decryptToken(stored: string): string {
  if (stored.startsWith("{")) {
    try {
      const { encryptedData, iv, authTag } = JSON.parse(stored);
      return decrypt(encryptedData, iv, authTag);
    } catch {
      // If decryption fails (e.g. key changed), return raw for migration
      return stored;
    }
  }
  // Plain text token (pre-encryption migration)
  return stored;
}

// ---------------------------------------------------------------------------
// Store token CRUD
// ---------------------------------------------------------------------------

export async function saveStoreToken(storeId: string, token: string) {
  const encrypted = encryptToken(token);
  await db.store.update({
    where: { id: storeId },
    data: { accessToken: encrypted },
  });
}

export async function getStoreToken(storeId: string): Promise<string | null> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { accessToken: true },
  });
  if (!store?.accessToken) return null;
  return decryptToken(store.accessToken);
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

export async function verifyAndExchangeToken(
  shop: string,
  code: string,
  state: string,
  storedState: string
): Promise<{ access_token: string; scope: string }> {
  if (state !== storedState) {
    throw new Error("OAuth state mismatch — possible CSRF attack");
  }
  return exchangeCode(shop, code);
}

// ---------------------------------------------------------------------------
// Push product to Shopify
// ---------------------------------------------------------------------------

export async function pushProductToShopify(
  storeId: string,
  productId: string
): Promise<{
  success: boolean;
  shopifyProductId?: string;
  error?: string;
}> {
  // 1. Read product with variants
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true, supplierProduct: true },
  });
  if (!product) return { success: false, error: "Product not found" };

  // 2. Read store & decrypt token
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return { success: false, error: "Store not found" };
  if (!store.accessToken) return { success: false, error: "Store has no access token" };
  if (!store.domain) return { success: false, error: "Store has no domain" };

  const accessToken = decryptToken(store.accessToken);
  const cleanDomain = store.domain.replace(/https?:\/\//, "").replace(/\/$/, "");

  // 3. Build images — fix protocol-relative URLs
  const images = Array.isArray(product.images)
    ? (product.images as string[])
        .filter((src) => typeof src === "string" && src.length > 0)
        .map((src) => {
          let url = src;
          if (url.startsWith("//")) url = `https:${url}`;
          return { src: url };
        })
        .slice(0, 10)
    : [];

  // 4. Build variants — convert Prisma Decimal to string
  const variants = product.variants.map((v) => ({
    price: String(Number(v.retailPrice) || 0),
    sku: v.sku || undefined,
    inventory_quantity: v.stock,
    option1: v.name,
    inventory_management: "shopify",
  }));

  // 5. POST to Shopify
  const apiUrl = `https://${cleanDomain}/admin/api/2024-10/products.json`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      product: {
        title: product.title,
        body_html: product.description || "",
        vendor: "OptiCart",
        product_type: product.category || "General",
        status: "draft",
        images: images.length > 0 ? images : undefined,
        variants: variants.length > 0 ? variants : undefined,
      },
    }),
  });

  // 6. Handle errors — 401 deactivates store
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      await db.store.update({
        where: { id: store.id },
        data: { isActive: false },
      });
      return {
        success: false,
        error: "Shopify access expired. Please disconnect and reconnect your store.",
      };
    }
    return { success: false, error: `Shopify error (${res.status}): ${text.slice(0, 200)}` };
  }

  const shopifyResponse = await res.json();
  const externalId = shopifyResponse.product?.id?.toString();

  // 7. Save ProductStoreLink
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

  return { success: true, shopifyProductId: externalId };
}

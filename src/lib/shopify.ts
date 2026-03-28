import crypto from "crypto";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SHOPIFY_SCOPES =
  "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory,read_fulfillments,write_fulfillments,read_locations";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export function buildShopifyAuthUrl(shop: string, state: string): string {
  const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
  const redirectUri = `${APP_URL}/api/shopify/callback`;

  return (
    `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  );
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function verifyHmac(query: Record<string, string>): boolean {
  if (!SHOPIFY_API_SECRET) return false;

  const hmac = query.hmac;
  if (!hmac) return false;

  const params = { ...query };
  delete params.hmac;
  delete params.signature;

  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const computed = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(sorted)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");

  const res = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`Shopify token exchange failed: ${res.status}`);
  }

  return res.json();
}

export async function shopifyApi(
  shop: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
  const url = `https://${cleanShop}/admin/api/2024-10/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getShopInfo(shop: string, accessToken: string) {
  const data = await shopifyApi(shop, accessToken, "shop.json");
  return data.shop;
}

export async function pushProductToShopify(
  shop: string,
  accessToken: string,
  product: {
    title: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    images?: Array<{ src: string }>;
    variants?: Array<{
      price: string;
      sku?: string;
      inventory_quantity?: number;
      option1?: string;
    }>;
  }
) {
  return shopifyApi(shop, accessToken, "products.json", {
    method: "POST",
    body: JSON.stringify({ product }),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyHmac, getShopInfo } from "@/lib/shopify";
import { db } from "@/lib/db";
import { encryptToken, verifyAndExchangeToken } from "@/services/shopify.service";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://opti-cart.vercel.app";

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { shop, code, state } = params;

    if (!shop || !code || !state) {
      return NextResponse.redirect(new URL("/stores?error=missing_params", baseUrl));
    }

    // ALWAYS validate HMAC — fail if secret is not configured
    if (!process.env.SHOPIFY_API_SECRET) {
      console.error("[Shopify Callback] SHOPIFY_API_SECRET is not set — cannot validate HMAC");
      return NextResponse.redirect(new URL("/stores?error=server_config", baseUrl));
    }

    const validHmac = verifyHmac(params);
    if (!validHmac) {
      console.error("[Shopify Callback] HMAC verification failed");
      return NextResponse.redirect(new URL("/stores?error=invalid_hmac", baseUrl));
    }

    // Find the store by domain
    const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    const store = await db.store.findFirst({
      where: { domain: cleanShop },
      orderBy: { createdAt: "desc" },
    });

    if (!store) {
      console.error("[Shopify Callback] No store found for domain:", cleanShop);
      return NextResponse.redirect(new URL("/stores?error=invalid_state", baseUrl));
    }

    // Validate OAuth state matches the stored state
    const settings = (store.settings as Record<string, unknown>) || {};
    const storedState = settings.oauthState as string | undefined;
    if (!storedState) {
      console.error("[Shopify Callback] No stored OAuth state for store:", store.id);
      return NextResponse.redirect(new URL("/stores?error=invalid_state", baseUrl));
    }

    // Exchange code for token (also validates state)
    const tokenData = await verifyAndExchangeToken(shop, code, state, storedState);

    // Encrypt and save token + activate store
    const encryptedToken = encryptToken(tokenData.access_token);

    // Get shop info
    let shopName = store.name;
    let shopInfo: Record<string, unknown> = {};
    try {
      const info = await getShopInfo(shop, tokenData.access_token);
      shopName = info.name || shopName;
      shopInfo = {
        name: info.name,
        email: info.email,
        currency: info.currency,
        country: info.country_name,
        plan: info.plan_display_name,
        domain: info.domain,
        myshopifyDomain: info.myshopify_domain,
      };
    } catch (err) {
      console.error("[Shopify Callback] Could not fetch shop info:", err);
    }

    await db.store.update({
      where: { id: store.id },
      data: {
        name: shopName,
        accessToken: encryptedToken,
        isActive: true,
        lastSyncAt: new Date(),
        settings: {
          verified: true,
          scope: tokenData.scope,
          connectedAt: new Date().toISOString(),
          shopInfo,
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.redirect(new URL("/stores?success=connected", baseUrl));
  } catch (err: unknown) {
    console.error("[Shopify Callback] Error:", err);
    return NextResponse.redirect(new URL("/stores?error=connection_failed", baseUrl));
  }
}

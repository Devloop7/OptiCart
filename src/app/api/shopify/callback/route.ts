import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getShopInfo, verifyHmac } from "@/lib/shopify";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://opti-cart.vercel.app";

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { shop, code, state } = params;

    console.log("[Shopify Callback] Received:", { shop, hasCode: !!code, state: state?.slice(0, 8) });

    if (!shop || !code || !state) {
      console.error("[Shopify Callback] Missing params:", { shop, code: !!code, state: !!state });
      return NextResponse.redirect(new URL("/stores?error=missing_params", baseUrl));
    }

    // Verify HMAC if API secret is configured
    if (process.env.SHOPIFY_API_SECRET) {
      const valid = verifyHmac(params);
      if (!valid) {
        console.error("[Shopify Callback] HMAC verification failed");
        return NextResponse.redirect(new URL("/stores?error=invalid_hmac", baseUrl));
      }
    }

    // Find the pending store with matching state
    const cleanShop = shop.replace(/https?:\/\//, "").replace(/\/$/, "");
    const store = await db.store.findFirst({
      where: {
        domain: cleanShop,
        isActive: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!store) {
      console.error("[Shopify Callback] No pending store found for:", cleanShop);
      return NextResponse.redirect(new URL("/stores?error=invalid_state", baseUrl));
    }

    // Exchange code for permanent access token
    console.log("[Shopify Callback] Exchanging code for token...");
    const tokenData = await exchangeCodeForToken(shop, code);
    console.log("[Shopify Callback] Token received, scope:", tokenData.scope);

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

    // Update store with token and activate
    await db.store.update({
      where: { id: store.id },
      data: {
        name: shopName,
        accessToken: tokenData.access_token,
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

    console.log("[Shopify Callback] Store connected successfully:", shopName);
    return NextResponse.redirect(new URL("/stores?success=connected", baseUrl));
  } catch (err: unknown) {
    console.error("[Shopify Callback] Error:", err);
    return NextResponse.redirect(new URL("/stores?error=connection_failed", baseUrl));
  }
}

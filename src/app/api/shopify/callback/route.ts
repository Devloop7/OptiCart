import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getShopInfo, verifyHmac } from "@/lib/shopify";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { shop, code, state } = params;

    if (!shop || !code || !state) {
      return NextResponse.redirect(new URL("/stores?error=missing_params", req.url));
    }

    // Verify HMAC if API secret is configured
    if (process.env.SHOPIFY_API_SECRET) {
      const valid = verifyHmac(params);
      if (!valid) {
        return NextResponse.redirect(new URL("/stores?error=invalid_hmac", req.url));
      }
    }

    // Find the pending store with matching state
    const store = await db.store.findFirst({
      where: {
        domain: shop.replace(/https?:\/\//, "").replace(/\/$/, ""),
        isActive: false,
        settings: { path: ["oauthState"], equals: state },
      },
    });

    if (!store) {
      return NextResponse.redirect(new URL("/stores?error=invalid_state", req.url));
    }

    // Exchange code for permanent access token
    const tokenData = await exchangeCodeForToken(shop, code);

    // Get shop info
    let shopName = store.name;
    try {
      const shopInfo = await getShopInfo(shop, tokenData.access_token);
      shopName = shopInfo.name || shopName;
    } catch {
      // Non-critical, keep original name
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
          scope: tokenData.scope,
          connectedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.redirect(new URL("/stores?success=connected", req.url));
  } catch (err: unknown) {
    console.error("Shopify callback error:", err);
    return NextResponse.redirect(new URL("/stores?error=connection_failed", req.url));
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/get-user";
import { buildShopifyAuthUrl, generateNonce } from "@/lib/shopify";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const shop = body.shop?.trim();

    if (!shop) {
      return NextResponse.json({ ok: false, error: "Shop domain is required" }, { status: 400 });
    }

    // Validate shop domain format
    let shopDomain = shop.replace(/https?:\/\//, "").replace(/\/$/, "");

    // Auto-append .myshopify.com if needed
    if (!shopDomain.includes(".")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    const state = generateNonce();

    // Check for existing pending store and update, or create new
    const existing = await db.store.findFirst({
      where: { workspaceId: workspace.id, domain: shopDomain },
    });

    let storeId: string;
    if (existing) {
      await db.store.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          settings: { oauthState: state, status: "pending" },
        },
      });
      storeId = existing.id;
    } else {
      const store = await db.store.create({
        data: {
          workspaceId: workspace.id,
          name: shopDomain.split(".")[0],
          platform: "SHOPIFY",
          domain: shopDomain,
          isActive: false,
          settings: { oauthState: state, status: "pending" },
        },
      });
      storeId = store.id;
    }

    const authUrl = buildShopifyAuthUrl(shopDomain, state);

    console.log("[Shopify Auth] Redirecting to:", authUrl);

    return NextResponse.json({
      ok: true,
      data: { authUrl, storeId },
    });
  } catch (err: unknown) {
    console.error("[Shopify Auth Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

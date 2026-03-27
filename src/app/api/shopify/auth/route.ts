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
    const shopDomain = shop
      .replace(/https?:\/\//, "")
      .replace(/\/$/, "");

    if (!shopDomain.includes(".myshopify.com") && !shopDomain.includes(".")) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid Shopify store domain (e.g. mystore.myshopify.com)" },
        { status: 400 }
      );
    }

    const state = generateNonce();

    // Store the state + workspace in a pending store record
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

    const authUrl = buildShopifyAuthUrl(shopDomain, state);

    return NextResponse.json({
      ok: true,
      data: { authUrl, storeId: store.id },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

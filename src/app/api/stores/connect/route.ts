import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const connectSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(["SHOPIFY", "WOOCOMMERCE", "EBAY", "TIKTOK_SHOP"]),
  domain: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = connectSchema.parse(body);

    let domain = data.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // For Shopify: verify the token works by calling the shop API
    let shopInfo: Record<string, unknown> | null = null;
    let verified = false;

    if (data.platform === "SHOPIFY" && data.accessToken) {
      // Ensure domain ends with .myshopify.com for API calls
      let apiDomain = domain;
      if (!apiDomain.endsWith(".myshopify.com")) {
        // Try to fix common issues
        apiDomain = apiDomain.replace(/\.myshopify\.com.*$/, ".myshopify.com");
      }

      try {
        const apiUrl = `https://${apiDomain}/admin/api/2024-10/shop.json`;
        const res = await fetch(apiUrl, {
          headers: {
            "X-Shopify-Access-Token": data.accessToken,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const json = await res.json();
          shopInfo = json.shop;
          verified = true;
          if (json.shop?.name) {
            data.name = json.shop.name;
          }
          // Use the correct myshopify domain
          if (json.shop?.myshopify_domain) {
            domain = json.shop.myshopify_domain;
          }
        } else {
          const text = await res.text();
          if (res.status === 401 || res.status === 403) {
            return error(
              "Invalid access token. Make sure you copied the full token starting with 'shpat_' from your Shopify custom app.",
              400
            );
          }
          return error(
            `Shopify returned error ${res.status}. Check your store URL and token. URL tried: ${apiDomain}`,
            400
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return error(
          `Could not reach Shopify at ${apiDomain}. Check the store URL is correct. (${message})`,
          400
        );
      }
    }

    // Check if store with this domain already exists
    const existing = await db.store.findFirst({
      where: { workspaceId: workspace.id, domain },
    });

    const settingsObj: Record<string, unknown> = {
      verified,
      connectedAt: new Date().toISOString(),
    };
    if (shopInfo) {
      settingsObj.shopInfo = {
        name: shopInfo.name,
        email: shopInfo.email,
        currency: shopInfo.currency,
        country: shopInfo.country_name,
        plan: shopInfo.plan_display_name,
        domain: shopInfo.domain,
        myshopifyDomain: shopInfo.myshopify_domain,
      };
    }

    if (existing) {
      const store = await db.store.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          accessToken: data.accessToken || null,
          isActive: true,
          lastSyncAt: new Date(),
          settings: settingsObj as Prisma.InputJsonValue,
        },
      });
      return success({ store, verified, updated: true });
    }

    const store = await db.store.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        platform: data.platform,
        domain,
        accessToken: data.accessToken || null,
        isActive: true,
        lastSyncAt: verified ? new Date() : null,
        settings: settingsObj as Prisma.InputJsonValue,
      },
    });

    return success({ store, verified }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

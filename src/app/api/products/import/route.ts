import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  sourceUrl: z.string().url(),
  storeId: z.string().optional(),
  // Allow direct import data as fallback
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.number().optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        stock: z.number().optional(),
        sku: z.string().optional(),
      })
    )
    .optional(),
});

function extractProductId(url: string): string | null {
  // AliExpress: /item/1005003000123456.html
  const aliMatch = url.match(/\/item\/(\d+)/);
  if (aliMatch) return aliMatch[1];
  // productId=123 or productId/123
  const paramMatch = url.match(/product[Ii]d[=\/](\d+)/);
  if (paramMatch) return paramMatch[1];
  // Just a plain number
  if (/^\d+$/.test(url.trim())) return url.trim();
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = importSchema.parse(body);

    const externalId = extractProductId(data.sourceUrl);

    // Look up default pricing rule
    const pricingRule = await db.pricingRule.findFirst({
      where: { workspaceId: workspace.id, isDefault: true },
    });
    const multiplier = pricingRule ? Number(pricingRule.multiplier) : 2.0;
    const fixedAddon = pricingRule ? Number(pricingRule.fixedAddon) : 0;

    // Try to find the supplier product - search ALL suppliers, not just workspace-scoped
    let supplierProduct = null;
    if (externalId) {
      supplierProduct = await db.supplierProduct.findFirst({
        where: { externalId },
        include: { variants: true },
      });
    }

    if (supplierProduct) {
      // Import from supplier catalog
      const product = await db.product.create({
        data: {
          workspaceId: workspace.id,
          supplierProductId: supplierProduct.id,
          title: supplierProduct.title,
          description: supplierProduct.description,
          images: supplierProduct.images as Prisma.InputJsonValue,
          status: "DRAFT",
          category: ((supplierProduct.rawData as Record<string, unknown>)?.category as string) || null,
          variants: {
            create:
              supplierProduct.variants.length > 0
                ? supplierProduct.variants.map((sv) => ({
                    supplierVariantId: sv.id,
                    name: sv.name,
                    sku: sv.sku,
                    supplierCost: sv.price,
                    retailPrice: Number(sv.price) * multiplier + fixedAddon,
                    stock: sv.stock,
                    image: sv.image,
                  }))
                : [
                    {
                      name: "Default",
                      supplierCost:
                        ((supplierProduct.rawData as Record<string, unknown>)?.price as number) || 0,
                      retailPrice:
                        (((supplierProduct.rawData as Record<string, unknown>)?.price as number) || 0) *
                          multiplier +
                        fixedAddon,
                      stock: 100,
                    },
                  ],
          },
          ...(data.storeId
            ? { storeLinks: { create: { storeId: data.storeId } } }
            : {}),
        },
        include: {
          variants: true,
          storeLinks: true,
          supplierProduct: { select: { id: true, title: true, sourceUrl: true } },
        },
      });

      return success(product, 201);
    }

    // Fallback: create product directly from provided data or minimal info
    const title = data.title || `Product ${externalId || "Import"}`;
    const price = data.price || 9.99;
    const images = data.images || [];

    const product = await db.product.create({
      data: {
        workspaceId: workspace.id,
        title,
        description: data.description || null,
        images: images as Prisma.InputJsonValue,
        status: "DRAFT",
        variants: {
          create:
            data.variants && data.variants.length > 0
              ? data.variants.map((v) => ({
                  name: v.name,
                  sku: v.sku || null,
                  supplierCost: v.price,
                  retailPrice: v.price * multiplier + fixedAddon,
                  stock: v.stock || 100,
                }))
              : [
                  {
                    name: "Default",
                    supplierCost: price,
                    retailPrice: price * multiplier + fixedAddon,
                    stock: 100,
                  },
                ],
        },
        ...(data.storeId
          ? { storeLinks: { create: { storeId: data.storeId } } }
          : {}),
      },
      include: {
        variants: true,
        storeLinks: true,
      },
    });

    return success(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

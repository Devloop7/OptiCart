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
});

function extractAliExpressProductId(url: string): string | null {
  // Matches patterns like /item/1005003000123456.html or /item/1005003000123456
  const match = url.match(/\/item\/(\d+)/);
  if (match) return match[1];
  // Matches patterns like productId=1005003000123456
  const paramMatch = url.match(/product[Ii]d[=\/](\d+)/);
  if (paramMatch) return paramMatch[1];
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = importSchema.parse(body);

    const externalId = extractAliExpressProductId(data.sourceUrl);
    if (!externalId) {
      return error("Could not parse product ID from the provided URL", 400);
    }

    // Look up existing SupplierProduct by externalId within workspace suppliers
    const supplierProduct = await db.supplierProduct.findFirst({
      where: {
        externalId,
        supplier: { workspaceId: workspace.id },
      },
      include: { variants: true },
    });

    if (!supplierProduct) {
      return error(
        "Product not found in supplier catalog - please add via supplier import first",
        404
      );
    }

    // Look up default pricing rule for workspace
    const pricingRule = await db.pricingRule.findFirst({
      where: { workspaceId: workspace.id, isDefault: true },
    });

    const multiplier = pricingRule ? Number(pricingRule.multiplier) : 2.0;
    const fixedAddon = pricingRule ? Number(pricingRule.fixedAddon) : 0;

    // Create Product + ProductVariants from SupplierProduct data
    const product = await db.product.create({
      data: {
        workspaceId: workspace.id,
        supplierProductId: supplierProduct.id,
        title: supplierProduct.title,
        description: supplierProduct.description,
        images: supplierProduct.images as Prisma.InputJsonValue,
        status: "DRAFT",
        variants: {
          create: supplierProduct.variants.map((sv) => ({
            supplierVariantId: sv.id,
            name: sv.name,
            sku: sv.sku,
            supplierCost: sv.price,
            retailPrice: Number(sv.price) * multiplier + fixedAddon,
            stock: sv.stock,
            image: sv.image,
          })),
        },
        ...(data.storeId
          ? {
              storeLinks: {
                create: { storeId: data.storeId },
              },
            }
          : {}),
      },
      include: {
        variants: true,
        storeLinks: true,
        supplierProduct: { select: { id: true, title: true, sourceUrl: true } },
      },
    });

    return success(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

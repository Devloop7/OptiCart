import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ productId: string }> };

const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  stockSyncEnabled: z.boolean().optional(),
  priceSyncEnabled: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        sku: z.string().optional(),
        supplierCost: z.number().min(0),
        retailPrice: z.number().min(0),
        stock: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),
});

async function findProduct(workspaceId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, workspaceId },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { productId } = await params;

    const product = await db.product.findFirst({
      where: { id: productId, workspaceId: workspace.id },
      include: {
        variants: true,
        storeLinks: { include: { store: { select: { id: true, name: true } } } },
        supplierProduct: {
          include: { variants: true },
        },
      },
    });

    if (!product) return error("Product not found", 404);
    return success(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { productId } = await params;

    const existing = await findProduct(workspace.id, productId);
    if (!existing) return error("Product not found", 404);

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    const { variants, ...productFields } = data;

    const product = await db.$transaction(async (tx) => {
      if (variants) {
        const existingVariantIds = variants
          .filter((v) => v.id)
          .map((v) => v.id as string);

        // Delete variants not in the update list
        await tx.productVariant.deleteMany({
          where: {
            productId,
            id: { notIn: existingVariantIds },
          },
        });

        for (const v of variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                supplierCost: v.supplierCost,
                retailPrice: v.retailPrice,
                stock: v.stock,
                isActive: v.isActive,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId,
                name: v.name,
                sku: v.sku,
                supplierCost: v.supplierCost,
                retailPrice: v.retailPrice,
                stock: v.stock ?? 0,
              },
            });
          }
        }
      }

      return tx.product.update({
        where: { id: productId },
        data: productFields,
        include: { variants: true },
      });
    });

    return success(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { productId } = await params;

    const existing = await findProduct(workspace.id, productId);
    if (!existing) return error("Product not found", 404);

    await db.product.delete({ where: { id: productId } });
    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

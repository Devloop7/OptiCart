import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { updateProductSchema } from "@/lib/validators/product";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { productId } = await ctx.params;

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        store: { select: { id: true, name: true, storeType: true } },
        supplier: { select: { id: true, name: true, platform: true } },
        priceHistory: {
          orderBy: { detectedAt: "desc" },
          take: 50,
        },
        watcherTasks: true,
      },
    });

    if (!product) {
      return error("Product not found", 404);
    }

    return success(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { productId } = await ctx.params;
    const body = updateProductSchema.parse(await req.json());

    const existing = await db.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      return error("Product not found", 404);
    }

    const { storeId, supplierId, variants, ...updateData } = body;
    const product = await db.product.update({
      where: { id: productId },
      data: {
        ...updateData,
        ...(variants !== undefined && { variants: variants as Parameters<typeof db.product.update>[0]["data"]["variants"] }),
        ...(storeId && { store: { connect: { id: storeId } } }),
        ...(supplierId && { supplier: { connect: { id: supplierId } } }),
      },
    });

    return success(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { productId } = await ctx.params;

    const existing = await db.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      return error("Product not found", 404);
    }

    await db.product.delete({ where: { id: productId } });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

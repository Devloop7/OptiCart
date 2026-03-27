import { NextRequest } from "next/server";
import { z } from "zod";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ storeId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { storeId } = await ctx.params;

    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            products: true,
            automatedOrders: true,
          },
        },
      },
    });

    if (!store) {
      return error("Store not found", 404);
    }

    const recentOrdersCount = await db.automatedOrder.count({
      where: {
        storeId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return success({
      ...store,
      productCount: store._count.products,
      totalOrderCount: store._count.automatedOrders,
      recentOrdersCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateStoreSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().url().optional().or(z.literal("")).or(z.null()),
  apiEndpoint: z.string().url().optional().or(z.literal("")).or(z.null()),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { storeId } = await ctx.params;
    const body = updateStoreSchema.parse(await req.json());

    const existing = await db.store.findUnique({ where: { id: storeId } });
    if (!existing) {
      return error("Store not found", 404);
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.domain !== undefined) data.domain = body.domain || null;
    if (body.apiEndpoint !== undefined) data.apiEndpoint = body.apiEndpoint || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.settings !== undefined) data.settings = body.settings;

    const store = await db.store.update({
      where: { id: storeId },
      data,
    });

    return success(store);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { storeId } = await ctx.params;

    const existing = await db.store.findUnique({ where: { id: storeId } });
    if (!existing) {
      return error("Store not found", 404);
    }

    await db.store.delete({ where: { id: storeId } });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

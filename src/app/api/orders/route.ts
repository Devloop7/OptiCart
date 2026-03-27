import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  storeId: z.string().min(1),
  externalOrderId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.record(z.string(), z.unknown()),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const url = req.nextUrl.searchParams;

    const status = url.get("status") as string | null;
    const search = url.get("search");
    const storeId = url.get("storeId");
    const page = Math.max(1, parseInt(url.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { workspaceId: workspace.id };
    if (status) where.status = status;
    if (storeId) where.storeId = storeId;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { externalOrderId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.storeOrder.findMany({
        where,
        include: {
          items: { include: { product: { select: { title: true } } } },
          store: { select: { id: true, name: true } },
          supplierOrders: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.storeOrder.count({ where }),
    ]);

    return success({ orders, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = createOrderSchema.parse(body);

    // Verify store belongs to workspace
    const store = await db.store.findFirst({
      where: { id: data.storeId, workspaceId: workspace.id },
    });
    if (!store) return error("Store not found", 404);

    // Resolve items with pricing
    const itemsData = await Promise.all(
      data.items.map(async (item) => {
        const product = await db.product.findFirst({
          where: { id: item.productId, workspaceId: workspace.id },
        });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        let supplierCost = 0;
        let sellingPrice = 0;

        if (item.variantId) {
          const variant = await db.productVariant.findFirst({
            where: { id: item.variantId, productId: item.productId },
          });
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
          supplierCost = Number(variant.supplierCost);
          sellingPrice = Number(variant.retailPrice);
        } else {
          // Use first variant as default
          const variant = await db.productVariant.findFirst({
            where: { productId: item.productId },
            orderBy: { name: "asc" },
          });
          if (variant) {
            supplierCost = Number(variant.supplierCost);
            sellingPrice = Number(variant.retailPrice);
          }
        }

        const profit = (sellingPrice - supplierCost) * item.quantity;

        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          supplierCost,
          sellingPrice,
          profit,
        };
      })
    );

    const totalAmount = itemsData.reduce(
      (sum, i) => sum + i.sellingPrice * i.quantity,
      0
    );
    const totalProfit = itemsData.reduce((sum, i) => sum + i.profit, 0);

    const order = await db.storeOrder.create({
      data: {
        workspaceId: workspace.id,
        storeId: data.storeId,
        externalOrderId: data.externalOrderId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        shippingAddress: data.shippingAddress as Prisma.InputJsonValue,
        totalAmount,
        totalProfit,
        items: {
          create: itemsData.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            supplierCost: i.supplierCost,
            sellingPrice: i.sellingPrice,
            profit: i.profit,
          })),
        },
        logs: {
          create: { action: "ORDER_CREATED", details: "Order created manually" },
        },
      },
      include: {
        items: { include: { product: { select: { title: true } } } },
        store: { select: { id: true, name: true } },
      },
    });

    return success(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

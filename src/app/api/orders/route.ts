import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validators/order";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      db.automatedOrder.findMany({
        where,
        include: {
          product: { select: { title: true, supplierPrice: true, sellingPrice: true } },
          store: { select: { name: true, storeType: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.automatedOrder.count({ where }),
    ]);

    return success({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createOrderSchema.parse(await req.json());
    const product = await db.product.findUniqueOrThrow({ where: { id: body.productId } });
    const supplierCost = Number(product.supplierPrice) * body.quantity;
    const profit = body.sellingPrice - supplierCost;

    const order = await db.automatedOrder.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        quantity: body.quantity,
        customerName: body.customerName,
        customerAddress: body.customerAddress,
        sellingPrice: body.sellingPrice,
        supplierCost,
        profit,
        priceAtOrder: product.supplierPrice,
        priceAtLastCheck: product.supplierPrice,
        status: "PENDING",
      },
    });

    return success(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderId: string }> };

const updateOrderSchema = z.object({
  status: z
    .enum([
      "NEW",
      "IN_PROGRESS",
      "ORDERED_FROM_SUPPLIER",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "ERROR",
    ])
    .optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
});

async function findOrder(workspaceId: string, orderId: string) {
  return db.storeOrder.findFirst({
    where: { id: orderId, workspaceId },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { orderId } = await params;

    const order = await db.storeOrder.findFirst({
      where: { id: orderId, workspaceId: workspace.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        supplierOrders: true,
        logs: { orderBy: { createdAt: "desc" } },
        store: { select: { id: true, name: true } },
      },
    });

    if (!order) return error("Order not found", 404);

    // Serialize Decimal fields to numbers for JSON
    const serialized = {
      ...order,
      totalAmount: Number(order.totalAmount),
      totalProfit: Number(order.totalProfit),
      items: order.items.map((i) => ({
        ...i,
        supplierCost: Number(i.supplierCost),
        sellingPrice: Number(i.sellingPrice),
        profit: Number(i.profit),
      })),
      supplierOrders: order.supplierOrders.map((so) => ({
        ...so,
        cost: Number(so.cost),
      })),
    };

    return success(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { orderId } = await params;

    const existing = await findOrder(workspace.id, orderId);
    if (!existing) return error("Order not found", 404);

    const body = await req.json();
    const data = updateOrderSchema.parse(body);

    const order = await db.$transaction(async (tx) => {
      // If marking as ORDERED_FROM_SUPPLIER, create a SupplierOrder
      if (data.status === "ORDERED_FROM_SUPPLIER") {
        const alreadyOrdered = await tx.supplierOrder.findFirst({
          where: { orderId },
        });
        if (!alreadyOrdered) {
          await tx.supplierOrder.create({
            data: {
              orderId,
              status: "NEW",
              placedAt: new Date(),
            },
          });
        }
      }

      // If tracking info provided, update the supplier order
      if (data.trackingNumber || data.trackingUrl) {
        const supplierOrder = await tx.supplierOrder.findFirst({
          where: { orderId },
          orderBy: { createdAt: "desc" },
        });
        if (supplierOrder) {
          await tx.supplierOrder.update({
            where: { id: supplierOrder.id },
            data: {
              trackingNumber: data.trackingNumber ?? supplierOrder.trackingNumber,
              trackingUrl: data.trackingUrl ?? supplierOrder.trackingUrl,
              status: data.status === "SHIPPED" ? "SHIPPED" : supplierOrder.status,
              shippedAt:
                data.status === "SHIPPED" ? new Date() : supplierOrder.shippedAt,
            },
          });
        }
      }

      // Log the status change
      const logDetails: string[] = [];
      if (data.status) logDetails.push(`Status changed to ${data.status}`);
      if (data.notes) logDetails.push(`Notes: ${data.notes}`);
      if (data.trackingNumber)
        logDetails.push(`Tracking: ${data.trackingNumber}`);

      if (logDetails.length > 0) {
        await tx.orderLog.create({
          data: {
            orderId,
            action: data.status ? `STATUS_${data.status}` : "UPDATE",
            details: logDetails.join("; "),
          },
        });
      }

      return tx.storeOrder.update({
        where: { id: orderId },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true } },
              variant: { select: { id: true, name: true, sku: true } },
            },
          },
          supplierOrders: true,
          logs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });
    });

    // Serialize Decimal fields
    const serialized = {
      ...order,
      totalAmount: Number(order.totalAmount),
      totalProfit: Number(order.totalProfit),
      items: order.items.map((i) => ({
        ...i,
        supplierCost: Number(i.supplierCost),
        sellingPrice: Number(i.sellingPrice),
        profit: Number(i.profit),
      })),
      supplierOrders: order.supplierOrders.map((so) => ({
        ...so,
        cost: Number(so.cost),
      })),
    };

    return success(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}

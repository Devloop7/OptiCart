import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await db.automatedOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        product: true,
        store: { select: { name: true, storeType: true, userId: true } },
      },
    });
    return success(order);
  } catch (err) {
    return handleApiError(err);
  }
}

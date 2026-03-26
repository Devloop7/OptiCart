import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { OrderProcessor } from "@/services/order-processor.service";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    if (!body.userId) return error("userId is required", 400);
    const order = await OrderProcessor.approveManually(orderId, body.userId);
    return success(order);
  } catch (err) {
    return handleApiError(err);
  }
}

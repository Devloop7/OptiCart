import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { OrderProcessor } from "@/services/order-processor.service";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const result = await OrderProcessor.processOrder(orderId);
    return success(result, result.success ? 200 : 422);
  } catch (err) {
    return handleApiError(err);
  }
}

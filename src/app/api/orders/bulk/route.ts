import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { OrderProcessor } from "@/services/order-processor.service";
import { z } from "zod";
export const dynamic = "force-dynamic";

const bulkActionSchema = z.object({
  action: z.enum(["approve", "cancel"]),
  ids: z.array(z.string()).min(1).max(100),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bulkActionSchema.parse(await req.json());
    const results: { success: number; failed: number; errors: Array<{ id: string; error: string }> } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (body.action === "approve") {
      for (const id of body.ids) {
        try {
          // For approve, we use OrderProcessor which validates ownership and state
          await OrderProcessor.approveManually(id, body.userId ?? "system");
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    } else if (body.action === "cancel") {
      for (const id of body.ids) {
        try {
          await OrderProcessor.transitionOrder(id, "CANCELLED" as never, {
            notes: "Cancelled via bulk action",
          });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    } else {
      return error("Invalid action", 400);
    }

    return success(results);
  } catch (err) {
    return handleApiError(err);
  }
}

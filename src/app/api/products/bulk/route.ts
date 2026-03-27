import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const bulkDeleteSchema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
});

const bulkUpdateStatusSchema = z.object({
  action: z.literal("updateStatus"),
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISCONTINUED", "ERROR"]),
});

const bulkUpdatePricingSchema = z.object({
  action: z.literal("updatePricing"),
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
  markupPercentage: z.number().min(0, "Markup must be non-negative"),
});

const bulkActionSchema = z.discriminatedUnion("action", [
  bulkDeleteSchema,
  bulkUpdateStatusSchema,
  bulkUpdatePricingSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const body = bulkActionSchema.parse(await req.json());

    switch (body.action) {
      case "delete": {
        const result = await db.product.deleteMany({
          where: { id: { in: body.ids } },
        });
        return success({ deleted: result.count });
      }

      case "updateStatus": {
        const result = await db.product.updateMany({
          where: { id: { in: body.ids } },
          data: { status: body.status },
        });
        return success({ updated: result.count });
      }

      case "updatePricing": {
        const products = await db.product.findMany({
          where: { id: { in: body.ids } },
          select: { id: true, supplierPrice: true },
        });

        const multiplier = 1 + body.markupPercentage / 100;
        let updated = 0;

        for (const product of products) {
          const newSellingPrice =
            Math.round(Number(product.supplierPrice) * multiplier * 100) / 100;
          await db.product.update({
            where: { id: product.id },
            data: { sellingPrice: newSellingPrice },
          });
          updated++;
        }

        return success({ updated });
      }

      default:
        return error("Unknown action", 400);
    }
  } catch (err) {
    return handleApiError(err);
  }
}

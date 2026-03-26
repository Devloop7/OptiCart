import { z } from "zod/v4";

export const createOrderSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  customerName: z.string().min(1, "Customer name is required"),
  customerAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
  sellingPrice: z.number().positive("Selling price must be positive"),
});

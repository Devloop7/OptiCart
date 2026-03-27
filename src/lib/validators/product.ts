import { z } from "zod/v4";

export const createProductSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  supplierId: z.string().min(1).optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  supplierPrice: z.number().nonnegative("Supplier price must be non-negative"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  currency: z.string().default("USD"),
  supplierStock: z.number().int().min(0, "Stock must be non-negative"),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  variants: z.unknown().optional(),
  autoSync: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  storeId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISCONTINUED", "ERROR"])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

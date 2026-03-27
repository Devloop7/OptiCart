import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import {
  createProductSchema,
  productFilterSchema,
} from "@/lib/validators/product";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = productFilterSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const where: Record<string, unknown> = {};
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
    }

    const orderBy: Record<string, string> = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy,
      }),
      db.product.count({ where }),
    ]);

    return success({
      products,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createProductSchema.parse(await req.json());

    const product = await db.product.create({
      data: {
        storeId: body.storeId,
        supplierId: body.supplierId,
        title: body.title,
        description: body.description,
        supplierPrice: body.supplierPrice,
        sellingPrice: body.sellingPrice,
        currency: body.currency,
        supplierStock: body.supplierStock,
        images: body.images ?? [],
        tags: body.tags ?? [],
        variants: body.variants ?? [],
        autoSync: body.autoSync,
        status: body.supplierStock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      },
    });

    return success(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
  supplierProductId: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        sku: z.string().optional(),
        supplierCost: z.number().min(0),
        retailPrice: z.number().min(0),
        stock: z.number().int().min(0).optional().default(0),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const url = req.nextUrl.searchParams;

    const status = url.get("status") as string | null;
    const search = url.get("search");
    const storeId = url.get("storeId");
    const page = Math.max(1, parseInt(url.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { workspaceId: workspace.id };
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (storeId) {
      where.storeLinks = { some: { storeId } };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          variants: true,
          storeLinks: { include: { store: { select: { id: true, name: true } } } },
          supplierProduct: { select: { id: true, title: true, sourceUrl: true } },
          _count: { select: { variants: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Serialize Decimal fields to numbers for JSON
    const serialized = products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        supplierCost: Number(v.supplierCost),
        retailPrice: Number(v.retailPrice),
      })),
    }));

    return success({ products: serialized, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();
    const body = await req.json();
    const data = createProductSchema.parse(body);

    const product = await db.product.create({
      data: {
        workspaceId: workspace.id,
        title: data.title,
        description: data.description,
        images: data.images,
        tags: data.tags,
        category: data.category,
        supplierProductId: data.supplierProductId,
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            supplierCost: v.supplierCost,
            retailPrice: v.retailPrice,
            stock: v.stock,
          })),
        },
      },
      include: { variants: true },
    });

    return success(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

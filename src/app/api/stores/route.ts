import { NextRequest } from "next/server";
import { z } from "zod";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  storeType: z.enum(["SHOPIFY", "WOOCOMMERCE", "EBAY", "TIKTOK_SHOP"]),
  domain: z.string().url().optional().or(z.literal("")),
  apiEndpoint: z.string().url().optional().or(z.literal("")),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return success({ stores: [] });
    }

    const stores = await db.store.findMany({
      where: { userId: user.id },
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });

    return success({
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        storeType: s.storeType,
        domain: s.domain,
        apiEndpoint: s.apiEndpoint,
        isActive: s.isActive,
        lastSyncAt: s.lastSyncAt,
        settings: s.settings,
        productCount: s._count.products,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const body = createStoreSchema.parse(await req.json());

    const store = await db.store.create({
      data: {
        userId: user.id,
        name: body.name,
        storeType: body.storeType,
        domain: body.domain || null,
        apiEndpoint: body.apiEndpoint || null,
      },
    });

    return success(store, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

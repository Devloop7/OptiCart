import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ storeId: string }> };

const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

async function findStore(workspaceId: string, storeId: string) {
  return db.store.findFirst({
    where: { id: storeId, workspaceId },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { storeId } = await params;

    const store = await db.store.findFirst({
      where: { id: storeId, workspaceId: workspace.id },
      include: {
        _count: {
          select: { storeLinks: true, orders: true },
        },
      },
    });

    if (!store) return error("Store not found", 404);
    return success(store);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { storeId } = await params;

    const existing = await findStore(workspace.id, storeId);
    if (!existing) return error("Store not found", 404);

    const body = await req.json();
    const data = updateStoreSchema.parse(body);

    const updateData: Prisma.StoreUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.domain !== undefined && { domain: data.domain }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.settings !== undefined && { settings: data.settings as Prisma.InputJsonValue }),
    };

    const store = await db.store.update({
      where: { id: storeId },
      data: updateData,
    });

    return success(store);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { workspace } = await getWorkspace();
    const { storeId } = await params;

    const existing = await findStore(workspace.id, storeId);
    if (!existing) return error("Store not found", 404);

    await db.store.delete({ where: { id: storeId } });
    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

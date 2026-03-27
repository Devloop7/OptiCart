import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const user = await db.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        maxStores: true,
        maxProducts: true,
        createdAt: true,
      },
    });
    if (!user) return success(null);
    return success(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await db.user.findFirst();
    if (!user) return success(null);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        maxStores: true,
        maxProducts: true,
        createdAt: true,
      },
    });
    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

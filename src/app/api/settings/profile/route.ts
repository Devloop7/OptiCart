import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  name: z.string().min(1),
});

export async function GET(_req: NextRequest) {
  try {
    const { user } = await getWorkspace();
    return success(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getWorkspace();
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: data.name },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/get-user";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const { user } = await getWorkspace();
    const body = await req.json();
    const data = passwordSchema.parse(body);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { hashedPassword: true },
    });

    if (!dbUser?.hashedPassword) {
      return error("No password set for this account", 400);
    }

    const valid = await bcrypt.compare(data.currentPassword, dbUser.hashedPassword);
    if (!valid) {
      return error("Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    return success({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import { success, error, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return error("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await db.user.create({
      data: {
        name: body.name,
        email,
        hashedPassword,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return success(user, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

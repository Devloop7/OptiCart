import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function getWorkspace() {
  const user = await requireUser();

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          subscription: { include: { plan: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) throw new Error("NO_WORKSPACE");

  return {
    user,
    membership,
    workspace: membership.workspace,
    plan: membership.workspace.subscription?.plan ?? null,
  };
}

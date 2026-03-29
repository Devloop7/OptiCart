import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Not logged in", session: null });
    }

    // Find user's membership and workspace
    const membership = await db.membership.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    });

    if (!membership) {
      return NextResponse.json({
        ok: false,
        error: "No workspace found for user",
        userId: session.user.id,
        email: session.user.email,
      });
    }

    // Get ALL stores for this workspace
    const stores = await db.store.findMany({
      where: { workspaceId: membership.workspaceId },
      select: {
        id: true,
        name: true,
        platform: true,
        domain: true,
        isActive: true,
        accessToken: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      userId: session.user.id,
      email: session.user.email,
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      storeCount: stores.length,
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        domain: s.domain,
        isActive: s.isActive,
        hasToken: !!s.accessToken,
        tokenStart: s.accessToken ? s.accessToken.slice(0, 12) + "..." : "NONE",
        lastSync: s.lastSyncAt,
        created: s.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

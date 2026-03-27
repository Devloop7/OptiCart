import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const [tasks, total, stats] = await Promise.all([
      db.watcherTask.findMany({
        where,
        include: {
          product: {
            select: { title: true, supplierPrice: true, sellingPrice: true, status: true, store: { select: { name: true } } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.watcherTask.count({ where }),
      Promise.all([
        db.watcherTask.count({ where: { status: "ACTIVE" } }),
        db.watcherTask.count({ where: { status: "PAUSED" } }),
        db.watcherTask.count({ where: { status: "ERROR" } }),
        db.watcherTask.count({ where: { status: "COMPLETED" } }),
      ]),
    ]);

    return success({
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: { active: stats[0], paused: stats[1], error: stats[2], completed: stats[3] },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

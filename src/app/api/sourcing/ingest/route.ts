import { NextRequest, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/get-user";
import { db } from "@/lib/db";
import { catalogService } from "@/lib/product-catalog";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await getWorkspace();

    const body = await req.json();
    const categories: string[] = body.categories ?? [
      "electronics",
      "fashion",
      "home",
      "beauty",
      "sports",
      "toys",
      "pets",
      "auto",
    ];
    const pagesPerCategory: number = Math.min(body.pagesPerCategory ?? 2, 10);

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "RAPIDAPI_KEY is not configured" },
        { status: 400 },
      );
    }

    // Find or create the AliExpress supplier for this workspace
    let supplier = await db.workspaceSupplier.findFirst({
      where: {
        workspaceId: workspace.id,
        platform: "ALIEXPRESS",
      },
    });

    if (!supplier) {
      supplier = await db.workspaceSupplier.create({
        data: {
          workspaceId: workspace.id,
          platform: "ALIEXPRESS",
          name: "AliExpress (RapidAPI)",
          config: {},
          isActive: true,
        },
      });
    }

    const result = await catalogService.ingestFromRapidAPI(
      supplier.id,
      categories,
      pagesPerCategory,
      apiKey,
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (message === "NO_WORKSPACE") {
      return NextResponse.json(
        { ok: false, error: "No workspace found" },
        { status: 403 },
      );
    }

    console.error("Ingestion error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to ingest products" },
      { status: 500 },
    );
  }
}

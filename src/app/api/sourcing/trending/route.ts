import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/lib/product-catalog";
import { getProductProvider } from "@/lib/product-providers";
import { db } from "@/lib/db";

// Track whether auto-ingestion has been triggered this process lifetime
let autoIngestTriggered = false;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    // Try cached products first
    const cachedCount = await catalogService.getCachedCount();

    // Auto-ingest: if fewer than 50 products and RAPIDAPI_KEY is set, trigger background ingestion
    if (cachedCount < 50 && !autoIngestTriggered && process.env.RAPIDAPI_KEY) {
      autoIngestTriggered = true;
      triggerAutoIngest().catch((err) =>
        console.error("Auto-ingest background error:", err),
      );
    }

    if (cachedCount > 0) {
      const result = await catalogService.getCachedProducts({
        category,
        page,
        limit: 12,
        trending: true,
        sort: "best_selling",
      });

      if (result.products.length > 0) {
        return NextResponse.json({ ok: true, data: result });
      }
    }

    // Fall back to provider
    const provider = await getProductProvider();
    const result = await provider.getTrendingProducts(category, page);

    return NextResponse.json({
      ok: true,
      data: { ...result, source: "demo" as const },
    });
  } catch (err) {
    console.error("Sourcing trending error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch trending products" },
      { status: 500 },
    );
  }
}

/**
 * Trigger a small background ingestion (2 pages per category) using the
 * first available workspace supplier or creating a system-level one.
 */
async function triggerAutoIngest(): Promise<void> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return;

  // Find or create a system-level AliExpress supplier
  let supplier = await db.workspaceSupplier.findFirst({
    where: { platform: "ALIEXPRESS" },
  });

  if (!supplier) {
    // We need a workspace — find any workspace
    const workspace = await db.workspace.findFirst();
    if (!workspace) {
      console.warn("Auto-ingest: no workspace available, skipping");
      return;
    }

    supplier = await db.workspaceSupplier.create({
      data: {
        workspaceId: workspace.id,
        platform: "ALIEXPRESS",
        name: "AliExpress (Auto-Ingest)",
        config: {},
        isActive: true,
      },
    });
  }

  console.log("Auto-ingest: starting background product ingestion...");

  const categories = [
    "electronics",
    "fashion",
    "home",
    "beauty",
    "sports",
    "toys",
    "pets",
    "auto",
  ];

  const result = await catalogService.ingestFromRapidAPI(
    supplier.id,
    categories,
    1, // just 1 page per keyword for auto-ingest to keep it light
    apiKey,
  );

  console.log(
    `Auto-ingest complete: ${result.totalFetched} fetched, ${result.totalNew} new, ${result.totalUpdated} updated`,
  );
}

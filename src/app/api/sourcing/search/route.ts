import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/lib/product-catalog";
import { getProductProvider } from "@/lib/product-providers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const category = searchParams.get("category") ?? undefined;
    const sort = searchParams.get("sort") ?? "best_selling";
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? "12")), 50);

    // Try cached products first (need at least 50 to be useful)
    const cachedCount = await catalogService.getCachedCount();
    if (cachedCount >= 50) {
      const result = await catalogService.getCachedProducts({
        search: q || undefined,
        category,
        sort,
        page,
        limit,
      });

      if (result.products.length > 0) {
        return NextResponse.json({ ok: true, data: result });
      }
    }

    // Fall back to provider (demo or live)
    const provider = await getProductProvider();
    const result = await provider.searchProducts(q, page, category);

    return NextResponse.json({
      ok: true,
      data: { ...result, source: "demo" as const },
    });
  } catch (err) {
    console.error("Sourcing search error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to search products" },
      { status: 500 },
    );
  }
}

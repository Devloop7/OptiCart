import { NextResponse } from "next/server";
import { catalogService } from "@/lib/product-catalog";
import { getProductProvider } from "@/lib/product-providers";
import { getWorkspace } from "@/lib/get-user";

export async function GET() {
  try {
    await getWorkspace();

    // Try cached categories first
    const cachedCount = await catalogService.getCachedCount();

    if (cachedCount >= 50) {
      const categories = await catalogService.getCachedCategories();
      if (categories.length > 0) {
        return NextResponse.json({
          ok: true,
          data: categories,
          source: "cached",
        });
      }
    }

    // Fall back to provider
    const provider = await getProductProvider();
    const categories = await provider.getCategories();

    return NextResponse.json({
      ok: true,
      data: categories,
      source: "demo",
    });
  } catch (err) {
    console.error("Sourcing categories error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

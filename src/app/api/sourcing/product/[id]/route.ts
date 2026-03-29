import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/lib/product-catalog";
import { getProductProvider } from "@/lib/product-providers";
import { getWorkspace } from "@/lib/get-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getWorkspace();

    const { id } = await params;

    // Try cached product first
    const cached = await catalogService.getCachedProduct(id);
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached,
        source: "cached",
      });
    }

    // Fall back to provider
    const provider = await getProductProvider();
    const product = await provider.getProductDetails(id);

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: product,
      source: "demo",
    });
  } catch (err) {
    console.error("Sourcing product detail error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch product details" },
      { status: 500 },
    );
  }
}

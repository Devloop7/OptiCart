import { NextRequest, NextResponse } from "next/server";
import { getProductProvider } from "@/lib/product-providers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const provider = await getProductProvider();
    const product = await provider.getProductDetails(id);

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    console.error("Sourcing product detail error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch product details" },
      { status: 500 },
    );
  }
}

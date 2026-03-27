import { NextRequest, NextResponse } from "next/server";
import { getProductProvider } from "@/lib/product-providers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const category = searchParams.get("category") ?? undefined;

    const provider = await getProductProvider();
    const result = await provider.searchProducts(q, page, category);

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("Sourcing search error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to search products" },
      { status: 500 },
    );
  }
}

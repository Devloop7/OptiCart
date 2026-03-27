import { NextRequest, NextResponse } from "next/server";
import { getProductProvider } from "@/lib/product-providers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const provider = await getProductProvider();
    const result = await provider.getTrendingProducts(category, page);

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("Sourcing trending error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch trending products" },
      { status: 500 },
    );
  }
}

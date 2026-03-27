import { NextResponse } from "next/server";
import { getProductProvider } from "@/lib/product-providers";

export async function GET() {
  try {
    const provider = await getProductProvider();
    const categories = await provider.getCategories();

    return NextResponse.json({ ok: true, data: categories });
  } catch (err) {
    console.error("Sourcing categories error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

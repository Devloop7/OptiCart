import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
export const dynamic = "force-dynamic";

interface WinningProduct {
  id: string;
  title: string;
  image: string;
  supplierPrice: number;
  suggestedPrice: number;
  margin: number;
  score: number;
  category: string;
  supplier: string;
  trending: boolean;
  demandLevel: "low" | "medium" | "high" | "very_high";
  competition: "low" | "medium" | "high";
  shippingDays: number;
  insights: string[];
  sourceUrl: string;
}

// Simulated winning products data - in production this would come from AI analysis
const WINNING_PRODUCTS: WinningProduct[] = [
  {
    id: "wp-001", title: "LED Sunset Projection Lamp", image: "/placeholder.svg",
    supplierPrice: 6.50, suggestedPrice: 29.99, margin: 78,
    score: 94, category: "Home Decor", supplier: "AliExpress", trending: true,
    demandLevel: "very_high", competition: "medium", shippingDays: 12,
    insights: ["TikTok trending with 2.3M views", "High impulse buy potential", "Great for gift market", "Low return rate (<2%)"],
    sourceUrl: "https://aliexpress.com/item/example1",
  },
  {
    id: "wp-002", title: "Portable Neck Fan USB Rechargeable", image: "/placeholder.svg",
    supplierPrice: 4.80, suggestedPrice: 24.99, margin: 81,
    score: 91, category: "Electronics", supplier: "CJ Dropshipping", trending: true,
    demandLevel: "very_high", competition: "high", shippingDays: 8,
    insights: ["Seasonal peak approaching (summer)", "Multiple color variants sell well", "Repeat customer potential", "Good for outdoor/sports niche"],
    sourceUrl: "https://cjdropshipping.com/item/example2",
  },
  {
    id: "wp-003", title: "Smart Posture Corrector with Vibration", image: "/placeholder.svg",
    supplierPrice: 8.20, suggestedPrice: 39.99, margin: 79,
    score: 88, category: "Health", supplier: "AliExpress", trending: false,
    demandLevel: "high", competition: "low", shippingDays: 15,
    insights: ["Evergreen health niche", "Strong Facebook ad performance", "Upsell opportunity with accessories", "Appeals to remote workers"],
    sourceUrl: "https://aliexpress.com/item/example3",
  },
  {
    id: "wp-004", title: "Magnetic Phone Mount for Car (MagSafe)", image: "/placeholder.svg",
    supplierPrice: 3.10, suggestedPrice: 19.99, margin: 84,
    score: 87, category: "Auto Accessories", supplier: "CJ Dropshipping", trending: true,
    demandLevel: "high", competition: "medium", shippingDays: 7,
    insights: ["Growing with MagSafe adoption", "Easy to demonstrate in video ads", "Low shipping cost", "Cross-sell with phone cases"],
    sourceUrl: "https://cjdropshipping.com/item/example4",
  },
  {
    id: "wp-005", title: "Mini Thermal Printer for Phone", image: "/placeholder.svg",
    supplierPrice: 12.50, suggestedPrice: 44.99, margin: 72,
    score: 85, category: "Gadgets", supplier: "AliExpress", trending: true,
    demandLevel: "high", competition: "low", shippingDays: 14,
    insights: ["Viral on Instagram and TikTok", "Great for journaling niche", "Consumable refills = recurring revenue", "Gift market potential"],
    sourceUrl: "https://aliexpress.com/item/example5",
  },
  {
    id: "wp-006", title: "Electric Scalp Massager", image: "/placeholder.svg",
    supplierPrice: 5.90, suggestedPrice: 29.99, margin: 80,
    score: 83, category: "Beauty", supplier: "AliExpress", trending: false,
    demandLevel: "medium", competition: "low", shippingDays: 12,
    insights: ["ASMR content drives sales", "High perceived value", "Good for relaxation/self-care niche", "Unisex appeal"],
    sourceUrl: "https://aliexpress.com/item/example6",
  },
  {
    id: "wp-007", title: "Cloud LED Night Light", image: "/placeholder.svg",
    supplierPrice: 7.80, suggestedPrice: 34.99, margin: 78,
    score: 82, category: "Home Decor", supplier: "CJ Dropshipping", trending: false,
    demandLevel: "medium", competition: "medium", shippingDays: 10,
    insights: ["Aesthetic room decor trend", "Strong Pinterest presence", "Appeals to Gen Z", "Low return rate"],
    sourceUrl: "https://cjdropshipping.com/item/example7",
  },
  {
    id: "wp-008", title: "Wireless Earbuds with LED Display Case", image: "/placeholder.svg",
    supplierPrice: 9.50, suggestedPrice: 39.99, margin: 76,
    score: 80, category: "Electronics", supplier: "AliExpress", trending: true,
    demandLevel: "very_high", competition: "high", shippingDays: 13,
    insights: ["LED case is key differentiator", "Strong AirPods alternative market", "Good for tech gadget stores", "Multiple price points available"],
    sourceUrl: "https://aliexpress.com/item/example8",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const minScore = parseInt(searchParams.get("minScore") || "0");
    const trending = searchParams.get("trending");
    const sort = searchParams.get("sort") || "score";

    let filtered = [...WINNING_PRODUCTS];

    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (minScore > 0) {
      filtered = filtered.filter((p) => p.score >= minScore);
    }
    if (trending === "true") {
      filtered = filtered.filter((p) => p.trending);
    }

    if (sort === "score") filtered.sort((a, b) => b.score - a.score);
    else if (sort === "margin") filtered.sort((a, b) => b.margin - a.margin);
    else if (sort === "price") filtered.sort((a, b) => a.supplierPrice - b.supplierPrice);

    const categories = [...new Set(WINNING_PRODUCTS.map((p) => p.category))];

    return success({ products: filtered, total: filtered.length, categories });
  } catch (err) {
    return handleApiError(err);
  }
}

// Product Catalog Service — manages cached product data in the database
// Products are fetched from external APIs and stored in SupplierProduct/SupplierVariant tables

import { db } from "@/lib/db";
import type { SourcedProduct } from "@/lib/product-providers";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogQueryOptions {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  trending?: boolean;
}

export interface CatalogResult {
  products: SourcedProduct[];
  total: number;
  page: number;
  pageSize: number;
  source: "cached" | "demo" | "live";
}

export interface IngestionResult {
  totalFetched: number;
  totalNew: number;
  totalUpdated: number;
}

// Search keywords per category for diverse results
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics: [
    "wireless earbuds",
    "phone case",
    "smart watch",
    "led strip lights",
    "portable charger",
    "webcam",
    "bluetooth speaker",
    "usb hub",
  ],
  fashion: [
    "sunglasses women",
    "silver necklace",
    "minimalist watch",
    "crossbody bag",
    "silk scarf",
    "leather belt",
    "hair clips",
  ],
  home: [
    "kitchen gadget",
    "led night light",
    "bathroom organizer",
    "plant pot ceramic",
    "wall shelf",
    "coffee mug",
    "desk organizer",
  ],
  beauty: [
    "makeup brush set",
    "facial roller",
    "hair straightener",
    "nail art",
    "skincare tool",
    "massage gun mini",
    "eye mask",
  ],
  sports: [
    "yoga mat",
    "resistance bands",
    "water bottle",
    "camping light",
    "fitness tracker",
    "jump rope",
    "gym gloves",
  ],
  toys: [
    "fidget toy",
    "rc car mini",
    "puzzle 3d",
    "art supplies set",
    "building blocks",
    "slime kit",
    "card game",
  ],
  pets: [
    "cat toy",
    "dog collar",
    "pet brush",
    "fish tank decoration",
    "pet bed small",
    "dog leash retractable",
    "cat scratcher",
  ],
  auto: [
    "car phone mount",
    "car vacuum",
    "dash cam mini",
    "car air freshener",
    "trunk organizer",
    "steering wheel cover",
    "car led",
  ],
};

// ---------------------------------------------------------------------------
// RapidAPI fetch helper with retries
// ---------------------------------------------------------------------------

interface RapidAPISearchResponse {
  result?: {
    resultList?: Array<{
      item?: {
        itemId?: string | number;
        title?: string;
        sales?: string;
        image?: string;
        sku?: { def?: { price?: string; promotionPrice?: string } };
        averageStar?: string;
        trade?: { tradeDesc?: string };
      };
    }>;
  };
}

async function fetchRapidAPISearch(
  apiKey: string,
  query: string,
  page: number,
): Promise<RapidAPISearchResponse | null> {
  const url = new URL(
    "https://aliexpress-datahub.p.rapidapi.com/item_search_2",
  );
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort_by", "default");

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "aliexpress-datahub.p.rapidapi.com",
        },
      });

      if (res.status === 429) {
        // Rate limited — wait and retry
        const waitMs = Math.min(2000 * (attempt + 1), 6000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        console.error(
          `RapidAPI search ${res.status}: ${res.statusText} (attempt ${attempt + 1})`,
        );
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      return (await res.json()) as RapidAPISearchResponse;
    } catch (err) {
      console.error(`RapidAPI fetch error (attempt ${attempt + 1}):`, err);
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Map RapidAPI item to SourcedProduct
// ---------------------------------------------------------------------------

function parseOrders(salesStr?: string): number {
  if (!salesStr) return 0;
  const match = salesStr.match(/([\d,]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10) || 0;
}

function mapRapidAPIItem(
  item: NonNullable<
    NonNullable<
      RapidAPISearchResponse["result"]
    >["resultList"]
  >[number]["item"],
  category: string,
): SourcedProduct | null {
  if (!item) return null;

  const id = String(item.itemId ?? "");
  if (!id) return null;

  const promoPrice = parseFloat(item.sku?.def?.promotionPrice ?? "0");
  const defPrice = parseFloat(item.sku?.def?.price ?? "0");
  const price = promoPrice > 0 ? promoPrice : defPrice;
  const originalPrice = defPrice > promoPrice && promoPrice > 0 ? defPrice : undefined;
  const rating = parseFloat(item.averageStar ?? "4.5");
  const orders = parseOrders(item.trade?.tradeDesc ?? item.sales);

  const images: string[] = [];
  if (item.image) {
    // AliExpress images sometimes have no protocol
    const src = item.image.startsWith("//")
      ? `https:${item.image}`
      : item.image;
    images.push(src);
  }

  return {
    externalId: id,
    sourceUrl: `https://www.aliexpress.com/item/${id}.html`,
    title: item.title ?? "Untitled Product",
    description: "",
    images,
    price: price || 9.99,
    originalPrice,
    currency: "USD",
    rating: Math.min(rating, 5),
    totalOrders: orders,
    category,
    shippingOptions: [
      { carrier: "AliExpress Standard Shipping", cost: 0, days: "15-25" },
    ],
    variants: [
      { id: "default", name: "Default", price: price || 9.99, stock: 100 },
    ],
    isTrending: orders > 10000,
    isNewArrival: orders < 1000,
  };
}

// ---------------------------------------------------------------------------
// Convert DB record to SourcedProduct
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupplierProductWithVariants = {
  id: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string | null;
  images: unknown;
  rating: unknown;
  totalOrders: number | null;
  shippingOptions: unknown;
  rawData: unknown;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  supplierId: string;
  variants: Array<{
    id: string;
    externalId: string;
    name: string;
    price: unknown;
    stock: number;
    image: string | null;
    attributes: unknown;
  }>;
};

/** Fix image URLs that start with // (no protocol) */
function fixImageUrl(url: string): string {
  if (typeof url !== "string") return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

/** Parse a JSON field that might be a string, array, or null */
function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // not valid JSON
    }
  }
  return [];
}

function dbRecordToSourced(
  record: SupplierProductWithVariants,
): SourcedProduct {
  const raw = (record.rawData ?? {}) as Record<string, unknown>;

  const toNum = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (v && typeof v === "object" && "toNumber" in v) {
      return (v as { toNumber: () => number }).toNumber();
    }
    return parseFloat(String(v)) || 0;
  };

  // Parse images — could be JSON string or array, then fix // prefixes
  const rawImages = parseJsonArray<string>(record.images);
  const images = rawImages.map(fixImageUrl).filter(Boolean);

  // Parse shipping options — could be JSON string or array
  const shippingOptions = parseJsonArray<SourcedProduct["shippingOptions"][number]>(
    record.shippingOptions,
  );

  return {
    externalId: record.externalId,
    sourceUrl: record.sourceUrl,
    title: record.title,
    description: record.description ?? "",
    images,
    price: toNum(raw.price ?? 0),
    originalPrice: raw.originalPrice ? toNum(raw.originalPrice) : undefined,
    currency: (raw.currency as string) ?? "USD",
    rating: toNum(record.rating),
    totalOrders: Number(record.totalOrders) || 0,
    category: (raw.category as string) ?? "general",
    shippingOptions,
    variants: record.variants.map((v) => ({
      id: v.externalId,
      name: v.name,
      price: toNum(v.price),
      stock: v.stock,
      image: v.image ? fixImageUrl(v.image) : undefined,
    })),
    isTrending: raw.isTrending === true || raw.trending === true,
    isNewArrival: raw.isNewArrival === true,
  };
}

// ---------------------------------------------------------------------------
// Catalog Service
// ---------------------------------------------------------------------------

export const catalogService = {
  /**
   * Ingest products from RapidAPI for a set of categories.
   * Returns how many were fetched, created, or updated.
   */
  async ingestFromRapidAPI(
    supplierId: string,
    categories: string[],
    pagesPerCategory: number,
    apiKey: string,
  ): Promise<IngestionResult> {
    let totalFetched = 0;
    let totalNew = 0;
    let totalUpdated = 0;

    for (const category of categories) {
      const keywords = CATEGORY_KEYWORDS[category] ?? [category];

      for (const keyword of keywords) {
        for (let page = 1; page <= pagesPerCategory; page++) {
          const data = await fetchRapidAPISearch(apiKey, keyword, page);
          const items = data?.result?.resultList ?? [];

          for (const entry of items) {
            const mapped = mapRapidAPIItem(entry.item, category);
            if (!mapped) continue;

            totalFetched++;

            try {
              const existing = await db.supplierProduct.findUnique({
                where: {
                  supplierId_externalId: {
                    supplierId,
                    externalId: mapped.externalId,
                  },
                },
              });

              const productData: Prisma.SupplierProductCreateInput = {
                supplier: { connect: { id: supplierId } },
                externalId: mapped.externalId,
                sourceUrl: mapped.sourceUrl,
                title: mapped.title,
                description: mapped.description,
                images: mapped.images as Prisma.InputJsonValue,
                rating: mapped.rating,
                totalOrders: mapped.totalOrders,
                shippingOptions: mapped.shippingOptions as Prisma.InputJsonValue,
                rawData: {
                  category,
                  price: mapped.price,
                  originalPrice: mapped.originalPrice,
                  currency: mapped.currency,
                  isTrending: mapped.isTrending,
                  isNewArrival: mapped.isNewArrival,
                } as Prisma.InputJsonValue,
                fetchedAt: new Date(),
              };

              if (existing) {
                await db.supplierProduct.update({
                  where: { id: existing.id },
                  data: {
                    title: productData.title,
                    description: productData.description,
                    images: productData.images,
                    rating: productData.rating,
                    totalOrders: productData.totalOrders,
                    shippingOptions: productData.shippingOptions,
                    rawData: productData.rawData,
                    fetchedAt: new Date(),
                  },
                });
                totalUpdated++;
              } else {
                const created = await db.supplierProduct.create({
                  data: productData,
                });

                // Create variants
                for (const v of mapped.variants) {
                  await db.supplierVariant.create({
                    data: {
                      supplierProduct: { connect: { id: created.id } },
                      externalId: v.id,
                      name: v.name,
                      price: v.price,
                      stock: v.stock,
                      image: v.image,
                    },
                  });
                }
                totalNew++;
              }
            } catch (err) {
              console.error(
                `Failed to upsert product ${mapped.externalId}:`,
                err,
              );
            }
          }

          // Small delay between pages to be respectful of rate limits
          if (page < pagesPerCategory) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
    }

    return { totalFetched, totalNew, totalUpdated };
  },

  /**
   * Query cached products from the database.
   */
  async getCachedProducts(
    options: CatalogQueryOptions,
  ): Promise<CatalogResult> {
    const {
      category,
      search,
      sort = "best_selling",
      page = 1,
      limit = 12,
      trending,
    } = options;

    // Build where clause using AND for composability
    const conditions: Prisma.SupplierProductWhereInput[] = [];

    if (search) {
      conditions.push({ title: { contains: search, mode: "insensitive" } });
    }

    if (category && category !== "all") {
      conditions.push({
        rawData: { path: ["category"], equals: category },
      });
    }

    if (trending) {
      conditions.push({
        OR: [
          { rawData: { path: ["isTrending"], equals: true } },
          { totalOrders: { gte: 10000 } },
        ],
      });
    }

    const where: Prisma.SupplierProductWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    // Determine orderBy
    let orderBy: Prisma.SupplierProductOrderByWithRelationInput;
    switch (sort) {
      case "price_low":
        // We store price in rawData, so sort by raw
        orderBy = { createdAt: "asc" }; // fallback — price sort done post-query
        break;
      case "price_high":
        orderBy = { createdAt: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "best_selling":
      default:
        orderBy = { totalOrders: "desc" };
        break;
    }

    const [records, total] = await Promise.all([
      db.supplierProduct.findMany({
        where,
        include: { variants: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplierProduct.count({ where }),
    ]);

    let products = records.map((r) =>
      dbRecordToSourced(r as unknown as SupplierProductWithVariants),
    );

    // Post-query price sorting (price is in rawData, not a direct column)
    if (sort === "price_low") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price_high") {
      products.sort((a, b) => b.price - a.price);
    }

    return {
      products,
      total,
      page,
      pageSize: limit,
      source: "cached",
    };
  },

  /**
   * Get categories with counts from cached products.
   */
  async getCachedCategories(): Promise<
    Array<{ id: string; name: string; count: number }>
  > {
    const CATEGORY_NAMES: Record<string, string> = {
      electronics: "Electronics",
      fashion: "Fashion",
      home: "Home & Garden",
      beauty: "Beauty & Health",
      sports: "Sports & Outdoors",
      toys: "Toys & Hobbies",
      pets: "Pets",
      auto: "Auto",
    };

    // Get all products and count by category from rawData
    const products = await db.supplierProduct.findMany({
      select: { rawData: true },
    });

    const counts: Record<string, number> = {};
    for (const p of products) {
      const raw = p.rawData as Record<string, unknown>;
      const cat = (raw?.category as string) ?? "general";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        name: CATEGORY_NAMES[id] ?? id,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Get a single cached product by externalId.
   */
  async getCachedProduct(externalId: string): Promise<SourcedProduct | null> {
    const record = await db.supplierProduct.findFirst({
      where: { externalId },
      include: { variants: true },
    });

    if (!record) return null;
    return dbRecordToSourced(record as unknown as SupplierProductWithVariants);
  },

  /**
   * Count total cached products.
   */
  async getCachedCount(): Promise<number> {
    return db.supplierProduct.count();
  },
};

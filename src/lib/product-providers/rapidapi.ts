import type {
  ProductDataProvider,
  SourcedProduct,
  ProductSearchResult,
  ProductCategory,
} from "./index";
import { DemoProvider } from "./demo";

const BASE_URL = "https://aliexpress-datahub.p.rapidapi.com";

interface RapidApiItem {
  item_id?: number | string;
  product_id?: number | string;
  title?: string;
  product_title?: string;
  product_main_image_url?: string;
  product_small_image_urls?: { string?: string[] };
  app_sale_price?: string;
  original_price?: string;
  target_sale_price?: string;
  target_original_price?: string;
  evaluate_rate?: string;
  lastest_volume?: number;
  orders?: number;
  second_level_category_name?: string;
  first_level_category_name?: string;
  logistics_info_dto?: {
    logistics_type?: string;
    delivery_time?: string;
    shipping_fee?: string;
  };
  sku_info?: Array<{
    sku_id?: string;
    sku_attr?: string;
    sku_price?: string;
    available_quantity?: number;
    sku_image?: string;
  }>;
  description?: string;
  product_url?: string;
}

function mapProduct(item: RapidApiItem): SourcedProduct {
  const id = String(item.item_id ?? item.product_id ?? "");
  const price = parseFloat(item.app_sale_price ?? item.target_sale_price ?? "0");
  const originalPrice = parseFloat(item.original_price ?? item.target_original_price ?? "0");
  const rating = parseFloat(item.evaluate_rate ?? "4.5");
  const orders = item.lastest_volume ?? item.orders ?? 0;

  const images: string[] = [];
  if (item.product_main_image_url) images.push(item.product_main_image_url);
  if (item.product_small_image_urls?.string) {
    images.push(...item.product_small_image_urls.string.slice(0, 4));
  }

  const variants: SourcedProduct["variants"] = (item.sku_info ?? []).map((sku, i) => ({
    id: sku.sku_id ?? `v${i}`,
    name: sku.sku_attr ?? `Variant ${i + 1}`,
    price: parseFloat(sku.sku_price ?? String(price)),
    stock: sku.available_quantity ?? 100,
    image: sku.sku_image,
  }));

  if (variants.length === 0) {
    variants.push({ id: "default", name: "Default", price, stock: 100 });
  }

  const shippingOptions: SourcedProduct["shippingOptions"] = [
    { carrier: "AliExpress Standard Shipping", cost: 0, days: "15-25" },
  ];

  if (item.logistics_info_dto) {
    const fee = parseFloat(item.logistics_info_dto.shipping_fee ?? "0");
    if (fee > 0) {
      shippingOptions.push({
        carrier: item.logistics_info_dto.logistics_type ?? "ePacket",
        cost: fee,
        days: item.logistics_info_dto.delivery_time ?? "10-18",
      });
    }
  }

  return {
    externalId: id,
    sourceUrl: item.product_url ?? `https://www.aliexpress.com/item/${id}.html`,
    title: item.title ?? item.product_title ?? "Untitled Product",
    description: item.description ?? "",
    images,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    currency: "USD",
    rating: Math.min(rating, 5),
    totalOrders: orders,
    category: item.second_level_category_name ?? item.first_level_category_name ?? "general",
    shippingOptions,
    variants,
    isTrending: orders > 10000,
    isNewArrival: orders < 1000,
  };
}

export class RapidApiProvider implements ProductDataProvider {
  private readonly apiKey: string;
  private readonly fallback = new DemoProvider();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private headers(): HeadersInit {
    return {
      "x-rapidapi-key": this.apiKey,
      "x-rapidapi-host": "aliexpress-datahub.p.rapidapi.com",
    };
  }

  private async fetchApi<T>(path: string, params: Record<string, string>): Promise<T | null> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }

    try {
      const res = await fetch(url.toString(), { headers: this.headers(), next: { revalidate: 300 } });
      if (!res.ok) {
        console.error(`RapidAPI ${res.status}: ${res.statusText}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.error("RapidAPI fetch error:", err);
      return null;
    }
  }

  async searchProducts(
    query: string,
    page = 1,
    category?: string,
  ): Promise<ProductSearchResult> {
    const data = await this.fetchApi<{
      result?: { products?: RapidApiItem[]; total_count?: number };
    }>("/item_search", {
      q: query || "trending",
      page: String(page),
      ...(category && category !== "all" ? { category_id: category } : {}),
    });

    if (!data?.result?.products?.length) {
      return this.fallback.searchProducts(query, page, category);
    }

    const products = data.result.products.map(mapProduct);
    return {
      products,
      total: data.result.total_count ?? products.length,
      page,
      pageSize: products.length,
    };
  }

  async getProductDetails(productId: string): Promise<SourcedProduct | null> {
    const data = await this.fetchApi<{
      result?: RapidApiItem;
    }>("/item_detail", { itemId: productId });

    if (!data?.result) {
      return this.fallback.getProductDetails(productId);
    }

    return mapProduct(data.result);
  }

  async getTrendingProducts(
    category?: string,
    page = 1,
  ): Promise<ProductSearchResult> {
    // RapidAPI does not have a dedicated trending endpoint, so search "best seller"
    const data = await this.fetchApi<{
      result?: { products?: RapidApiItem[]; total_count?: number };
    }>("/item_search", {
      q: "best seller",
      page: String(page),
      sort: "SALE_PRICE_ASC",
      ...(category && category !== "all" ? { category_id: category } : {}),
    });

    if (!data?.result?.products?.length) {
      return this.fallback.getTrendingProducts(category, page);
    }

    const products = data.result.products.map(mapProduct);
    return {
      products,
      total: data.result.total_count ?? products.length,
      page,
      pageSize: products.length,
    };
  }

  async getCategories(): Promise<ProductCategory[]> {
    // RapidAPI AliExpress DataHub does not expose a categories endpoint
    // so we return our known categories
    return this.fallback.getCategories();
  }
}

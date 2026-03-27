import type {
  ProductDataProvider,
  ProductSearchResult,
  SourcedProduct,
  ProductCategory,
} from "./index";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

export class CjDropshippingProvider implements ProductDataProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  static async authenticate(
    email: string,
    password: string
  ): Promise<string> {
    const res = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error(`CJ authentication failed: ${res.status}`);
    }

    const data = await res.json();
    if (!data.result || !data.data?.accessToken) {
      throw new Error(data.message || "CJ authentication failed");
    }

    return data.data.accessToken;
  }

  private async request(endpoint: string, body?: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${CJ_API_BASE}${endpoint}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": this.accessToken,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!res.ok) {
      throw new Error(`CJ API error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.result) {
      throw new Error(data.message || "CJ API request failed");
    }

    return data.data;
  }

  private mapProduct(item: Record<string, unknown>): SourcedProduct {
    const variants = Array.isArray(item.variants)
      ? (item.variants as Array<Record<string, unknown>>).map((v, i) => ({
          id: String(v.vid || i),
          name: String(v.variantName || v.variantKey || `Variant ${i + 1}`),
          price: Number(v.variantSellPrice || v.sellPrice || item.sellPrice || 0),
          stock: Number(v.variantVolume || 999),
          image: v.variantImage ? String(v.variantImage) : undefined,
        }))
      : [
          {
            id: "default",
            name: "Default",
            price: Number(item.sellPrice || 0),
            stock: 999,
          },
        ];

    return {
      externalId: String(item.pid || item.productId || ""),
      sourceUrl: String(item.productUrl || item.sourceUrl || `https://cjdropshipping.com/product/${item.pid}`),
      title: String(item.productNameEn || item.productName || ""),
      description: String(item.description || item.productNameEn || ""),
      images: Array.isArray(item.productImage)
        ? (item.productImage as string[])
        : item.productImage
        ? [String(item.productImage)]
        : [],
      price: Number(item.sellPrice || 0),
      originalPrice: Number(item.sourcePrice || item.sellPrice || 0),
      currency: "USD",
      rating: Number(item.productRating || 4.0),
      totalOrders: Number(item.orders || 0),
      category: String(item.categoryName || item.catId || "General"),
      shippingOptions: [
        {
          carrier: "CJ Packet",
          cost: 0,
          days: "7-15",
        },
        {
          carrier: "CJ ePacket",
          cost: 2.99,
          days: "5-10",
        },
      ],
      variants,
      isTrending: Number(item.orders || 0) > 500,
    };
  }

  async searchProducts(
    query: string,
    page = 1,
    category?: string
  ): Promise<ProductSearchResult> {
    const body: Record<string, unknown> = {
      productNameEn: query,
      pageNum: page,
      pageSize: 20,
    };

    if (category && category !== "all") {
      body.categoryId = category;
    }

    const data = (await this.request("/product/list", body)) as {
      list?: Array<Record<string, unknown>>;
      total?: number;
      pageNum?: number;
      pageSize?: number;
    };

    const list = data?.list || [];

    return {
      products: list.map((item) => this.mapProduct(item)),
      total: Number(data?.total || list.length),
      page,
      pageSize: 20,
    };
  }

  async getProductDetails(productId: string): Promise<SourcedProduct | null> {
    try {
      const data = (await this.request(
        `/product/query?pid=${encodeURIComponent(productId)}`
      )) as Record<string, unknown>;

      if (!data) return null;
      return this.mapProduct(data);
    } catch {
      return null;
    }
  }

  async getTrendingProducts(
    category?: string,
    page = 1
  ): Promise<ProductSearchResult> {
    return this.searchProducts("trending", page, category);
  }

  async getCategories(): Promise<ProductCategory[]> {
    try {
      const data = (await this.request("/product/getCategory")) as Array<
        Record<string, unknown>
      >;

      if (!Array.isArray(data)) return [];

      return data.map((cat) => ({
        id: String(cat.categoryId || cat.catId || ""),
        name: String(cat.categoryName || ""),
        count: Number(cat.productCount || 0),
      }));
    } catch {
      return [
        { id: "electronics", name: "Electronics", count: 0 },
        { id: "fashion", name: "Fashion", count: 0 },
        { id: "home", name: "Home & Garden", count: 0 },
        { id: "beauty", name: "Beauty", count: 0 },
        { id: "sports", name: "Sports", count: 0 },
      ];
    }
  }
}

// Product Data Provider — abstract interface + factory

export interface SourcedProduct {
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  totalOrders: number;
  category: string;
  shippingOptions: Array<{ carrier: string; cost: number; days: string }>;
  variants: Array<{ id: string; name: string; price: number; stock: number; image?: string }>;
  isTrending?: boolean;
  isNewArrival?: boolean;
}

export interface ProductSearchResult {
  products: SourcedProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  count: number;
}

export interface ProductDataProvider {
  searchProducts(query: string, page?: number, category?: string): Promise<ProductSearchResult>;
  getProductDetails(productId: string): Promise<SourcedProduct | null>;
  getTrendingProducts(category?: string, page?: number): Promise<ProductSearchResult>;
  getCategories(): Promise<ProductCategory[]>;
}

let _provider: ProductDataProvider | null = null;

export async function getProductProvider(): Promise<ProductDataProvider> {
  if (_provider) return _provider;

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (rapidApiKey) {
    const { RapidApiProvider } = await import("./rapidapi");
    _provider = new RapidApiProvider(rapidApiKey);
  } else {
    const { DemoProvider } = await import("./demo");
    _provider = new DemoProvider();
  }

  return _provider;
}

/** Reset provider (useful for testing) */
export function resetProvider(): void {
  _provider = null;
}

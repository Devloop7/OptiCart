import type { StoreType } from "@prisma/client";

export interface MarketplaceCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  shopDomain?: string;
  [key: string]: string | undefined;
}

export interface NormalizedProduct {
  externalId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  stock: number;
  variants: NormalizedVariant[];
  rawData: Record<string, unknown>;
}

export interface NormalizedVariant {
  externalId: string;
  title: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface NormalizedOrder {
  externalOrderId: string;
  customerName: string;
  customerAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: {
    externalProductId: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  currency: string;
  createdAt: Date;
}

export interface IMarketplaceAdapter {
  readonly storeType: StoreType;
  authenticate(credentials: MarketplaceCredentials): Promise<boolean>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
  listProducts(cursor?: string, limit?: number): AsyncGenerator<NormalizedProduct[]>;
  getProduct(externalId: string): Promise<NormalizedProduct | null>;
  createProduct(product: NormalizedProduct): Promise<string>;
  updateProduct(externalId: string, updates: Partial<NormalizedProduct>): Promise<void>;
  updatePrice(externalId: string, price: number): Promise<void>;
  updateStock(externalId: string, stock: number): Promise<void>;
  deleteProduct(externalId: string): Promise<void>;
  listOrders(since?: Date, cursor?: string): AsyncGenerator<NormalizedOrder[]>;
  getOrder(externalOrderId: string): Promise<NormalizedOrder | null>;
}

import type { SupplierPlatform } from "@prisma/client";

export interface SupplierProductInfo {
  price: number;
  currency: string;
  stock: number;
  title?: string;
  images?: string[];
  shippingCost?: number;
  estimatedDeliveryDays?: number;
}

export interface ISupplierAdapter {
  readonly platform: SupplierPlatform;
  fetchProductInfo(productUrl: string): Promise<SupplierProductInfo>;
  placeOrder(orderDetails: SupplierOrderRequest): Promise<SupplierOrderResult>;
  getOrderStatus(supplierOrderId: string): Promise<SupplierOrderStatus>;
}

export interface SupplierOrderRequest {
  productUrl: string;
  quantity: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  variants?: Record<string, string>;
}

export interface SupplierOrderResult {
  success: boolean;
  supplierOrderId?: string;
  error?: string;
  totalCost?: number;
}

export interface SupplierOrderStatus {
  status: "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}

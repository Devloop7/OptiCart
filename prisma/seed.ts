import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(__dirname, "..", ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Plans
  const plans = await Promise.all([
    db.plan.upsert({
      where: { tier: "FREE" },
      update: {},
      create: { tier: "FREE", name: "Free", monthlyPrice: 0, maxProducts: 25, maxOrdersMonth: 10, maxStores: 1, maxAiRequests: 5, automationFreq: 360, features: ["Basic product import", "Manual order fulfillment"] },
    }),
    db.plan.upsert({
      where: { tier: "STARTER" },
      update: {},
      create: { tier: "STARTER", name: "Starter", monthlyPrice: 29, maxProducts: 200, maxOrdersMonth: 100, maxStores: 2, maxAiRequests: 50, automationFreq: 60, features: ["AliExpress import", "Stock/price sync", "Basic AI research"] },
    }),
    db.plan.upsert({
      where: { tier: "PRO" },
      update: {},
      create: { tier: "PRO", name: "Pro", monthlyPrice: 79, maxProducts: 1000, maxOrdersMonth: 500, maxStores: 5, maxAiRequests: 200, automationFreq: 15, features: ["Everything in Starter", "Fast automations", "Advanced AI", "Priority support"] },
    }),
    db.plan.upsert({
      where: { tier: "SCALE" },
      update: {},
      create: { tier: "SCALE", name: "Scale", monthlyPrice: 199, maxProducts: 10000, maxOrdersMonth: 5000, maxStores: 20, maxAiRequests: 1000, automationFreq: 5, features: ["Everything in Pro", "Unlimited stores", "API access", "Dedicated support"] },
    }),
  ]);

  // Demo user
  const hashedPassword = hashSync("Demo1234!", 12);
  const user = await db.user.upsert({
    where: { email: "demo@opticart.app" },
    update: {},
    create: {
      email: "demo@opticart.app",
      name: "Demo User",
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Workspace
  const workspace = await db.workspace.create({
    data: {
      name: "Demo Store",
      slug: "demo-store",
      currency: "USD",
      timezone: "America/New_York",
    },
  });

  // Membership (owner)
  await db.membership.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });

  // Subscription (Starter plan)
  await db.subscription.create({
    data: {
      workspaceId: workspace.id,
      planId: plans[1].id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    },
  });

  // Stores
  const shopifyStore = await db.store.create({
    data: {
      workspaceId: workspace.id,
      name: "My Shopify Store",
      platform: "SHOPIFY",
      domain: "myshop.myshopify.com",
      isActive: true,
    },
  });

  // AliExpress supplier
  const supplier = await db.workspaceSupplier.create({
    data: {
      workspaceId: workspace.id,
      platform: "ALIEXPRESS",
      name: "AliExpress",
      isActive: true,
    },
  });

  // Default pricing rule
  await db.pricingRule.create({
    data: {
      workspaceId: workspace.id,
      name: "Default 2.5x Markup",
      multiplier: 2.5,
      fixedAddon: 0,
      minMarginPct: 25,
      isDefault: true,
    },
  });

  // Sample supplier products (AliExpress)
  const sp1 = await db.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      externalId: "1005006123456789",
      sourceUrl: "https://www.aliexpress.com/item/1005006123456789.html",
      title: "Wireless Bluetooth Earbuds TWS 5.3 Noise Cancelling",
      description: "High quality wireless earbuds with active noise cancellation and 30h battery life.",
      images: ["https://ae-pic-a1.aliexpress-media.com/kf/S1234.jpg"],
      rating: 4.7,
      totalOrders: 15420,
      shippingOptions: [
        { carrier: "AliExpress Standard", cost: 0, days: "15-25" },
        { carrier: "ePacket", cost: 2.50, days: "10-18" },
      ],
    },
  });

  const sv1a = await db.supplierVariant.create({ data: { supplierProductId: sp1.id, externalId: "v1", name: "Black", price: 8.99, stock: 5000, sku: "TWS-BLK" } });
  const sv1b = await db.supplierVariant.create({ data: { supplierProductId: sp1.id, externalId: "v2", name: "White", price: 8.99, stock: 3200, sku: "TWS-WHT" } });
  const sv1c = await db.supplierVariant.create({ data: { supplierProductId: sp1.id, externalId: "v3", name: "Blue", price: 9.49, stock: 1800, sku: "TWS-BLU" } });

  const sp2 = await db.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      externalId: "1005007987654321",
      sourceUrl: "https://www.aliexpress.com/item/1005007987654321.html",
      title: "LED Ring Light 10\" with Tripod Stand for TikTok Live Stream",
      description: "Professional ring light with adjustable brightness and color temperature.",
      images: ["https://ae-pic-a1.aliexpress-media.com/kf/S5678.jpg"],
      rating: 4.5,
      totalOrders: 8700,
      shippingOptions: [{ carrier: "AliExpress Standard", cost: 0, days: "20-30" }],
    },
  });

  const sv2a = await db.supplierVariant.create({ data: { supplierProductId: sp2.id, externalId: "v1", name: "10 inch", price: 12.50, stock: 2400, sku: "RING-10" } });
  const sv2b = await db.supplierVariant.create({ data: { supplierProductId: sp2.id, externalId: "v2", name: "12 inch + Phone Holder", price: 16.80, stock: 1100, sku: "RING-12P" } });

  // Products (imported from supplier)
  const product1 = await db.product.create({
    data: {
      workspaceId: workspace.id,
      supplierProductId: sp1.id,
      title: "Premium Wireless Earbuds - Noise Cancelling",
      description: "Crystal clear sound with ANC. 30-hour battery. Perfect for everyday use.",
      images: ["https://ae-pic-a1.aliexpress-media.com/kf/S1234.jpg"],
      tags: ["electronics", "audio", "earbuds"],
      category: "Electronics",
      status: "ACTIVE",
    },
  });

  const pv1a = await db.productVariant.create({ data: { productId: product1.id, supplierVariantId: sv1a.id, name: "Black", sku: "EARBUDS-BLK", supplierCost: 8.99, retailPrice: 24.99, stock: 5000 } });
  const pv1b = await db.productVariant.create({ data: { productId: product1.id, supplierVariantId: sv1b.id, name: "White", sku: "EARBUDS-WHT", supplierCost: 8.99, retailPrice: 24.99, stock: 3200 } });
  await db.productVariant.create({ data: { productId: product1.id, supplierVariantId: sv1c.id, name: "Blue", sku: "EARBUDS-BLU", supplierCost: 9.49, retailPrice: 26.99, stock: 1800 } });

  const product2 = await db.product.create({
    data: {
      workspaceId: workspace.id,
      supplierProductId: sp2.id,
      title: "Ring Light Kit - Perfect for Content Creators",
      description: "10-inch LED ring light with adjustable tripod. 3 color modes.",
      images: ["https://ae-pic-a1.aliexpress-media.com/kf/S5678.jpg"],
      tags: ["photography", "lighting", "content-creation"],
      category: "Photography",
      status: "ACTIVE",
    },
  });

  await db.productVariant.create({ data: { productId: product2.id, supplierVariantId: sv2a.id, name: "10 inch", sku: "RING-10", supplierCost: 12.50, retailPrice: 34.99, stock: 2400 } });
  await db.productVariant.create({ data: { productId: product2.id, supplierVariantId: sv2b.id, name: "12 inch + Phone Holder", sku: "RING-12P", supplierCost: 16.80, retailPrice: 44.99, stock: 1100 } });

  // Store links
  await db.productStoreLink.create({ data: { productId: product1.id, storeId: shopifyStore.id, isPushed: true, externalProductId: "shopify_123" } });
  await db.productStoreLink.create({ data: { productId: product2.id, storeId: shopifyStore.id, isPushed: true, externalProductId: "shopify_456" } });

  // Sample orders
  await db.storeOrder.create({
    data: {
      workspaceId: workspace.id,
      storeId: shopifyStore.id,
      externalOrderId: "SHOP-1001",
      status: "NEW",
      customerName: "John Smith",
      customerEmail: "john@example.com",
      shippingAddress: { street: "123 Main St", city: "New York", state: "NY", zip: "10001", country: "US" },
      totalAmount: 24.99,
      totalProfit: 16.00,
      items: {
        create: { productId: product1.id, variantId: pv1a.id, quantity: 1, supplierCost: 8.99, sellingPrice: 24.99, profit: 16.00 },
      },
    },
  });

  await db.storeOrder.create({
    data: {
      workspaceId: workspace.id,
      storeId: shopifyStore.id,
      externalOrderId: "SHOP-1002",
      status: "SHIPPED",
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      shippingAddress: { street: "456 Oak Ave", city: "Los Angeles", state: "CA", zip: "90001", country: "US" },
      totalAmount: 24.99,
      totalProfit: 16.00,
      items: {
        create: { productId: product1.id, variantId: pv1b.id, quantity: 1, supplierCost: 8.99, sellingPrice: 24.99, profit: 16.00 },
      },
      supplierOrders: {
        create: {
          supplierOrderId: "AE-8001234567",
          trackingNumber: "LX123456789CN",
          status: "SHIPPED",
          placedAt: new Date(Date.now() - 5 * 86400000),
          shippedAt: new Date(Date.now() - 2 * 86400000),
          cost: 8.99,
        },
      },
    },
  });

  // Automation rules
  await db.automationRule.create({
    data: {
      workspaceId: workspace.id,
      type: "STOCK_SYNC",
      name: "Pause when out of stock",
      status: "ACTIVE",
      config: { minStock: 5, action: "pause_product" },
      frequencyMinutes: 60,
    },
  });

  await db.automationRule.create({
    data: {
      workspaceId: workspace.id,
      type: "PRICE_SYNC",
      name: "Auto-update retail on supplier price change",
      status: "ACTIVE",
      config: { applyPricingRule: true, notifyOnChange: true },
      frequencyMinutes: 120,
    },
  });

  // Usage record
  const month = new Date().toISOString().slice(0, 7);
  await db.usageRecord.create({
    data: { workspaceId: workspace.id, month, products: 2, orders: 2, aiRequests: 0 },
  });

  console.log("Seed complete!");
  console.log("  User: demo@opticart.app / Demo1234!");
  console.log(`  Workspace: ${workspace.name} (${workspace.slug})`);
  console.log(`  Store: ${shopifyStore.name}`);
  console.log("  Products: 2 with variants");
  console.log("  Orders: 2");
  console.log("  Plans: 4 tiers");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());

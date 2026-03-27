import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "demo@opticart.app" },
    update: {},
    create: {
      email: "demo@opticart.app",
      name: "Demo User",
      hashedPassword: hashSync("Demo1234!", 10),
      subscriptionTier: "PRO",
      maxStores: 10,
      maxProducts: 10000,
    },
  });
  console.log(`User created: ${user.email} (id: ${user.id})`);

  // Create stores
  const shopify = await prisma.store.upsert({
    where: { id: "store-shopify-demo" },
    update: {},
    create: {
      id: "store-shopify-demo",
      userId: user.id,
      name: "My Shopify Store",
      storeType: "SHOPIFY",
      domain: "my-shopify-store.myshopify.com",
      isActive: true,
      lastSyncAt: new Date(),
    },
  });

  const ebay = await prisma.store.upsert({
    where: { id: "store-ebay-demo" },
    update: {},
    create: {
      id: "store-ebay-demo",
      userId: user.id,
      name: "eBay Dropship",
      storeType: "EBAY",
      domain: "ebay.com/usr/opticart-demo",
      isActive: true,
      lastSyncAt: new Date(Date.now() - 3600000),
    },
  });

  const woo = await prisma.store.upsert({
    where: { id: "store-woo-demo" },
    update: {},
    create: {
      id: "store-woo-demo",
      userId: user.id,
      name: "WooCommerce Site",
      storeType: "WOOCOMMERCE",
      domain: "shop.example.com",
      isActive: true,
      lastSyncAt: new Date(Date.now() - 7200000),
    },
  });
  console.log("Stores created: Shopify, eBay, WooCommerce");

  // Create suppliers
  const aliexpress = await prisma.supplier.upsert({
    where: { id: "supplier-ali-demo" },
    update: {},
    create: {
      id: "supplier-ali-demo",
      platform: "ALIEXPRESS",
      name: "AliExpress Top Seller",
      sourceUrl: "https://aliexpress.com/store/12345",
    },
  });

  const cj = await prisma.supplier.upsert({
    where: { id: "supplier-cj-demo" },
    update: {},
    create: {
      id: "supplier-cj-demo",
      platform: "CJ_DROPSHIPPING",
      name: "CJ Dropshipping",
      sourceUrl: "https://cjdropshipping.com",
    },
  });
  console.log("Suppliers created: AliExpress, CJ Dropshipping");

  // Create products
  const products = [
    { id: "prod-001", storeId: shopify.id, supplierId: aliexpress.id, title: "Wireless Bluetooth Earbuds Pro", supplierPrice: 8.50, sellingPrice: 29.99, stock: 450, status: "ACTIVE" as const },
    { id: "prod-002", storeId: shopify.id, supplierId: aliexpress.id, title: "LED Ring Light 10 inch", supplierPrice: 12.00, sellingPrice: 39.99, stock: 320, status: "ACTIVE" as const },
    { id: "prod-003", storeId: shopify.id, supplierId: cj.id, title: "Phone Holder Car Mount", supplierPrice: 3.20, sellingPrice: 14.99, stock: 890, status: "ACTIVE" as const },
    { id: "prod-004", storeId: shopify.id, supplierId: aliexpress.id, title: "Portable Blender USB", supplierPrice: 15.00, sellingPrice: 44.99, stock: 200, status: "ACTIVE" as const },
    { id: "prod-005", storeId: ebay.id, supplierId: aliexpress.id, title: "Smart Watch Fitness Tracker", supplierPrice: 18.50, sellingPrice: 59.99, stock: 175, status: "ACTIVE" as const },
    { id: "prod-006", storeId: ebay.id, supplierId: cj.id, title: "Magnetic Phone Case iPhone 15", supplierPrice: 4.80, sellingPrice: 19.99, stock: 600, status: "ACTIVE" as const },
    { id: "prod-007", storeId: ebay.id, supplierId: aliexpress.id, title: "Mini Projector HD 1080p", supplierPrice: 45.00, sellingPrice: 129.99, stock: 85, status: "ACTIVE" as const },
    { id: "prod-008", storeId: woo.id, supplierId: cj.id, title: "Yoga Mat Non-Slip", supplierPrice: 7.50, sellingPrice: 24.99, stock: 340, status: "ACTIVE" as const },
    { id: "prod-009", storeId: woo.id, supplierId: aliexpress.id, title: "Desk Organizer Bamboo", supplierPrice: 11.00, sellingPrice: 34.99, stock: 210, status: "ACTIVE" as const },
    { id: "prod-010", storeId: shopify.id, supplierId: aliexpress.id, title: "USB-C Hub 7-in-1", supplierPrice: 9.80, sellingPrice: 32.99, stock: 0, status: "OUT_OF_STOCK" as const },
    { id: "prod-011", storeId: ebay.id, supplierId: cj.id, title: "Sunset Lamp Projector", supplierPrice: 6.50, sellingPrice: 22.99, stock: 520, status: "ACTIVE" as const },
    { id: "prod-012", storeId: woo.id, supplierId: aliexpress.id, title: "Electric Toothbrush Sonic", supplierPrice: 8.00, sellingPrice: 27.99, stock: 410, status: "ACTIVE" as const },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        storeId: p.storeId,
        supplierId: p.supplierId,
        title: p.title,
        supplierPrice: p.supplierPrice,
        sellingPrice: p.sellingPrice,
        supplierStock: p.stock,
        status: p.status,
        autoSync: true,
        lastCheckedAt: new Date(Date.now() - Math.random() * 3600000),
      },
    });
  }
  console.log(`${products.length} products created`);

  // Create watcher tasks for active products
  for (const p of products.filter(p => p.status === "ACTIVE")) {
    await prisma.watcherTask.upsert({
      where: { id: `watcher-${p.id}` },
      update: {},
      create: {
        id: `watcher-${p.id}`,
        productId: p.id,
        status: Math.random() > 0.15 ? "ACTIVE" : (Math.random() > 0.5 ? "PAUSED" : "ERROR"),
        intervalMinutes: 60,
        lastRunAt: new Date(Date.now() - Math.random() * 3600000),
        nextRunAt: new Date(Date.now() + Math.random() * 3600000),
      },
    });
  }
  console.log("Watcher tasks created");

  // Create orders
  const orderStatuses = ["PENDING", "APPROVED", "PLACED", "SHIPPED", "DELIVERED"] as const;
  const orders = [
    { productId: "prod-001", storeId: shopify.id, customer: "John Smith", status: "DELIVERED", qty: 2, daysAgo: 5 },
    { productId: "prod-002", storeId: shopify.id, customer: "Sarah Johnson", status: "SHIPPED", qty: 1, daysAgo: 3 },
    { productId: "prod-005", storeId: ebay.id, customer: "Mike Wilson", status: "PLACED", qty: 1, daysAgo: 1 },
    { productId: "prod-003", storeId: shopify.id, customer: "Emily Davis", status: "DELIVERED", qty: 3, daysAgo: 7 },
    { productId: "prod-007", storeId: ebay.id, customer: "Chris Brown", status: "APPROVED", qty: 1, daysAgo: 0 },
    { productId: "prod-004", storeId: shopify.id, customer: "Lisa Anderson", status: "PENDING", qty: 1, daysAgo: 0 },
    { productId: "prod-006", storeId: ebay.id, customer: "David Lee", status: "DELIVERED", qty: 2, daysAgo: 10 },
    { productId: "prod-008", storeId: woo.id, customer: "Anna Martinez", status: "SHIPPED", qty: 1, daysAgo: 2 },
    { productId: "prod-009", storeId: woo.id, customer: "James Taylor", status: "DELIVERED", qty: 1, daysAgo: 8 },
    { productId: "prod-011", storeId: ebay.id, customer: "Rachel Green", status: "PLACED", qty: 2, daysAgo: 1 },
    { productId: "prod-012", storeId: woo.id, customer: "Tom White", status: "PENDING", qty: 1, daysAgo: 0 },
    { productId: "prod-001", storeId: shopify.id, customer: "Nina Patel", status: "DELIVERED", qty: 1, daysAgo: 12 },
  ];

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const product = products.find(p => p.id === o.productId)!;
    const supplierCost = product.supplierPrice * o.qty;
    const sellingTotal = product.sellingPrice * o.qty;
    const profit = sellingTotal - supplierCost;
    const createdAt = new Date(Date.now() - o.daysAgo * 86400000);

    await prisma.automatedOrder.upsert({
      where: { id: `order-${i + 1}` },
      update: {},
      create: {
        id: `order-${i + 1}`,
        storeId: o.storeId,
        productId: o.productId,
        status: o.status as any,
        quantity: o.qty,
        customerName: o.customer,
        customerAddress: { line1: "123 Main St", city: "New York", state: "NY", zip: "10001", country: "US" },
        supplierCost,
        sellingPrice: sellingTotal,
        profit,
        priceAtOrder: product.supplierPrice,
        priceAtLastCheck: product.supplierPrice,
        placedAt: ["PLACED", "SHIPPED", "DELIVERED"].includes(o.status) ? createdAt : null,
        shippedAt: ["SHIPPED", "DELIVERED"].includes(o.status) ? new Date(createdAt.getTime() + 86400000) : null,
        deliveredAt: o.status === "DELIVERED" ? new Date(createdAt.getTime() + 4 * 86400000) : null,
        createdAt,
      },
    });
  }
  console.log(`${orders.length} orders created`);

  // Create price history
  const priceChanges = [
    { productId: "prod-001", oldPrice: 9.50, newPrice: 8.50, hoursAgo: 2 },
    { productId: "prod-002", oldPrice: 14.00, newPrice: 12.00, hoursAgo: 6 },
    { productId: "prod-005", oldPrice: 20.00, newPrice: 18.50, hoursAgo: 12 },
    { productId: "prod-007", oldPrice: 42.00, newPrice: 45.00, hoursAgo: 24 },
    { productId: "prod-003", oldPrice: 3.50, newPrice: 3.20, hoursAgo: 48 },
  ];

  for (let i = 0; i < priceChanges.length; i++) {
    const pc = priceChanges[i];
    await prisma.priceHistory.upsert({
      where: { id: `ph-${i + 1}` },
      update: {},
      create: {
        id: `ph-${i + 1}`,
        productId: pc.productId,
        oldPrice: pc.oldPrice,
        newPrice: pc.newPrice,
        oldStock: 100 + Math.floor(Math.random() * 500),
        newStock: 100 + Math.floor(Math.random() * 500),
        detectedAt: new Date(Date.now() - pc.hoursAgo * 3600000),
      },
    });
  }
  console.log("Price history created");

  // Create activity logs
  const activities = [
    { action: "PRICE_CHANGE", details: '{"product":"Wireless Bluetooth Earbuds Pro","from":"$9.50","to":"$8.50"}', severity: "warning", hoursAgo: 0.03 },
    { action: "AUTO_ORDER", details: '{"orderId":"order-6","supplier":"AliExpress","product":"Portable Blender USB"}', severity: "info", hoursAgo: 0.08 },
    { action: "STORE_SYNC", details: '{"store":"My Shopify Store","products":5,"updated":2}', severity: "info", hoursAgo: 1 },
    { action: "ORDER_TRANSITION", details: '{"orderId":"order-2","from":"PLACED","to":"SHIPPED","product":"LED Ring Light"}', severity: "info", hoursAgo: 2 },
    { action: "WATCHER_ERROR", details: '{"product":"USB-C Hub 7-in-1","error":"Product page returned 404"}', severity: "error", hoursAgo: 3 },
    { action: "PRICE_CHANGE", details: '{"product":"Mini Projector HD 1080p","from":"$42.00","to":"$45.00"}', severity: "warning", hoursAgo: 5 },
    { action: "NEW_PRODUCT", details: '{"product":"Electric Toothbrush Sonic","store":"WooCommerce Site"}', severity: "info", hoursAgo: 8 },
    { action: "AUTO_ORDER", details: '{"orderId":"order-10","supplier":"CJ Dropshipping","product":"Sunset Lamp Projector"}', severity: "info", hoursAgo: 12 },
  ];

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: a.action,
        details: a.details,
        severity: a.severity,
        createdAt: new Date(Date.now() - a.hoursAgo * 3600000),
      },
    });
  }
  console.log("Activity logs created");

  // Create system lock (unlocked by default)
  await prisma.systemLock.upsert({
    where: { id: "main-lock" },
    update: {},
    create: {
      id: "main-lock",
      isLocked: false,
    },
  });
  console.log("System lock initialized");

  console.log("\nSeed complete! Login credentials:");
  console.log("  Email: demo@opticart.app");
  console.log("  Password: Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

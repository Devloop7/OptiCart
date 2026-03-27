import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Vercel cron endpoint — runs automation rules that are due
// Configure in vercel.json: {"crons": [{"path": "/api/cron/automations", "schedule": "*/5 * * * *"}]}
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return error("Unauthorized", 401);
  }

  const now = new Date();

  // Find due automation rules
  const dueRules = await db.automationRule.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { nextRunAt: null },
        { nextRunAt: { lte: now } },
      ],
    },
    include: {
      workspace: {
        include: {
          products: {
            where: { status: "ACTIVE" },
            include: {
              variants: true,
              supplierProduct: { include: { variants: true } },
            },
          },
          pricingRules: { where: { isDefault: true }, take: 1 },
        },
      },
    },
    take: 50,
  });

  const results = [];

  for (const rule of dueRules) {
    const run = await db.automationRun.create({
      data: { ruleId: rule.id, status: "RUNNING" },
    });

    let itemsChecked = 0;
    let itemsUpdated = 0;
    let errorMessage: string | null = null;

    try {
      const products = rule.workspace.products;
      const config = rule.config as Record<string, unknown>;

      if (rule.type === "STOCK_SYNC") {
        const minStock = (config.minStock as number) || 5;

        for (const product of products) {
          itemsChecked++;
          if (!product.supplierProduct) continue;

          const supplierVariants = product.supplierProduct.variants;
          let totalStock = 0;
          for (const sv of supplierVariants) {
            totalStock += sv.stock;
          }

          // Sync stock from supplier to product variants
          for (const pv of product.variants) {
            const sv = supplierVariants.find((s) => s.id === pv.supplierVariantId);
            if (sv && sv.stock !== pv.stock) {
              await db.productVariant.update({
                where: { id: pv.id },
                data: { stock: sv.stock },
              });
              itemsUpdated++;
            }
          }

          // Pause product if stock below threshold
          if (totalStock < minStock && product.status === "ACTIVE") {
            await db.product.update({
              where: { id: product.id },
              data: { status: "PAUSED" },
            });
            itemsUpdated++;

            await db.automationLog.create({
              data: { runId: run.id, level: "warn", message: `Paused "${product.title}" — stock ${totalStock} < ${minStock}` },
            });
          } else if (totalStock >= minStock && product.status === "PAUSED" && product.stockSyncEnabled) {
            await db.product.update({
              where: { id: product.id },
              data: { status: "ACTIVE" },
            });
            itemsUpdated++;

            await db.automationLog.create({
              data: { runId: run.id, level: "info", message: `Reactivated "${product.title}" — stock restored to ${totalStock}` },
            });
          }
        }
      }

      if (rule.type === "PRICE_SYNC") {
        const defaultPricingRule = rule.workspace.pricingRules[0];

        for (const product of products) {
          itemsChecked++;
          if (!product.supplierProduct || !product.priceSyncEnabled) continue;

          const supplierVariants = product.supplierProduct.variants;

          for (const pv of product.variants) {
            const sv = supplierVariants.find((s) => s.id === pv.supplierVariantId);
            if (!sv) continue;

            // Check if supplier price changed
            if (Number(sv.price) !== Number(pv.supplierCost)) {
              const oldCost = Number(pv.supplierCost);
              const newCost = Number(sv.price);

              // Apply pricing rule
              let newRetail = Number(pv.retailPrice);
              if (defaultPricingRule) {
                newRetail = newCost * Number(defaultPricingRule.multiplier) + Number(defaultPricingRule.fixedAddon);
                if (defaultPricingRule.maxPrice && newRetail > Number(defaultPricingRule.maxPrice)) {
                  newRetail = Number(defaultPricingRule.maxPrice);
                }
              }

              await db.productVariant.update({
                where: { id: pv.id },
                data: { supplierCost: newCost, retailPrice: newRetail },
              });
              itemsUpdated++;

              await db.automationLog.create({
                data: {
                  runId: run.id,
                  level: "info",
                  message: `Updated "${product.title}" variant "${pv.name}": cost $${oldCost} → $${newCost}, retail → $${newRetail.toFixed(2)}`,
                },
              });
            }
          }
        }
      }

      await db.automationRun.update({
        where: { id: run.id },
        data: { status: "SUCCESS", finishedAt: new Date(), itemsChecked, itemsUpdated },
      });
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
      await db.automationRun.update({
        where: { id: run.id },
        data: { status: "FAILED", finishedAt: new Date(), itemsChecked, itemsUpdated, errorMessage },
      });
    }

    // Update next run time
    await db.automationRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + rule.frequencyMinutes * 60000),
      },
    });

    results.push({
      ruleId: rule.id,
      type: rule.type,
      status: errorMessage ? "FAILED" : "SUCCESS",
      itemsChecked,
      itemsUpdated,
    });
  }

  return success({ rulesProcessed: results.length, results });
}

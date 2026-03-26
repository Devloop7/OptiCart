import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import type { AutomatedOrder } from "@prisma/client";
import { PRICE_ALERT_THRESHOLD, ORDER_TRANSITIONS } from "@/lib/constants";
import { translateError } from "@/lib/error-translator";
import { PanicLogger } from "@/lib/panic-logger";

/**
 * OrderProcessor: The "Zero-Mistake" Order Sync Engine
 *
 * State machine: PENDING -> PRICE_ALERT | STOCK_ALERT | APPROVED -> PLACED -> SHIPPED -> DELIVERED
 *
 * Before processing every order:
 * 1. Validates stock on supplier side
 * 2. Checks for price drift > threshold (default 5%)
 * 3. Validates expected profit is positive
 * 4. Pauses order and notifies user if any condition fails
 */
export class OrderProcessor {

  static isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = ORDER_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  static async transitionOrder(
    orderId: string,
    newStatus: OrderStatus,
    metadata?: { notes?: string; errorLog?: string; pauseReason?: string }
  ): Promise<AutomatedOrder> {
    return db.$transaction(async (tx) => {
      const order = await tx.automatedOrder.findUniqueOrThrow({
        where: { id: orderId },
      });

      if (!this.isValidTransition(order.status, newStatus)) {
        throw new Error(
          `Invalid order transition: ${order.status} -> ${newStatus}. ` +
          `Allowed: ${ORDER_TRANSITIONS[order.status]?.join(", ") || "none"}`
        );
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
        previousStatus: order.status,
        ...(metadata?.notes && { notes: metadata.notes }),
        ...(metadata?.errorLog && { errorLog: metadata.errorLog }),
        ...(metadata?.pauseReason && { pauseReason: metadata.pauseReason }),
      };

      if (newStatus === "PLACED") updateData.placedAt = new Date();
      if (newStatus === "SHIPPED") updateData.shippedAt = new Date();
      if (newStatus === "DELIVERED") updateData.deliveredAt = new Date();

      const updated = await tx.automatedOrder.update({
        where: { id: orderId },
        data: updateData,
      });

      await tx.activityLog.create({
        data: {
          action: "ORDER_TRANSITION",
          details: JSON.stringify({
            orderId,
            from: order.status,
            to: newStatus,
            reason: metadata?.pauseReason || metadata?.notes,
          }),
          severity: newStatus === "FAILED" ? "error" : "info",
        },
      });

      return updated;
    });
  }

  /**
   * Main order processing pipeline.
   * Validates supplier stock and price BEFORE approving.
   */
  static async processOrder(orderId: string): Promise<{
    success: boolean;
    status: OrderStatus;
    message: string;
  }> {
    const panicLogger = new PanicLogger();

    try {
      panicLogger.log("FETCH_ORDER", `Fetching order ${orderId}`);

      const order = await db.automatedOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          product: { include: { supplier: true } },
          store: true,
        },
      });

      if (order.status !== "PENDING") {
        return {
          success: false,
          status: order.status,
          message: `Order is not in PENDING state (current: ${order.status})`,
        };
      }

      const product = order.product;

      // ── Step 1: Validate Supplier Stock ──────────────────────
      panicLogger.log("CHECK_STOCK", `Checking stock for product ${product.id}`);

      if (product.supplierStock < order.quantity) {
        await this.transitionOrder(orderId, "STOCK_ALERT", {
          pauseReason: `Insufficient supplier stock. Needed: ${order.quantity}, Available: ${product.supplierStock}`,
          notes: "Order paused: supplier stock insufficient. Please review and approve manually.",
        });

        return {
          success: false,
          status: "STOCK_ALERT" as OrderStatus,
          message: `Supplier only has ${product.supplierStock} units (need ${order.quantity}). Order paused for review.`,
        };
      }

      // ── Step 2: Price Drift Detection (>5% = PAUSE) ─────────
      panicLogger.log("CHECK_PRICE", `Validating price for product ${product.id}`);

      const currentSupplierPrice = Number(product.supplierPrice);
      const priceAtOrder = order.priceAtOrder ? Number(order.priceAtOrder) : currentSupplierPrice;

      const priceDrift = priceAtOrder > 0
        ? Math.abs(((currentSupplierPrice - priceAtOrder) / priceAtOrder) * 100)
        : 0;

      if (priceDrift > PRICE_ALERT_THRESHOLD) {
        const direction = currentSupplierPrice > priceAtOrder ? "increased" : "decreased";

        await this.transitionOrder(orderId, "PRICE_ALERT", {
          pauseReason: `Supplier price ${direction} by ${priceDrift.toFixed(1)}% (was $${priceAtOrder.toFixed(2)}, now $${currentSupplierPrice.toFixed(2)})`,
          notes: `Order paused: price changed beyond ${PRICE_ALERT_THRESHOLD}% threshold. Review and approve manually to avoid profit loss.`,
        });

        await db.automatedOrder.update({
          where: { id: orderId },
          data: { priceAtLastCheck: product.supplierPrice },
        });

        return {
          success: false,
          status: "PRICE_ALERT" as OrderStatus,
          message: `Supplier price ${direction} by ${priceDrift.toFixed(1)}%. Was $${priceAtOrder.toFixed(2)}, now $${currentSupplierPrice.toFixed(2)}. Order paused for your review.`,
        };
      }

      // ── Step 3: Profit Validation ────────────────────────────
      panicLogger.log("VALIDATE_PROFIT", `Calculating profit for order ${orderId}`);

      const expectedProfit = Number(order.sellingPrice) - (currentSupplierPrice * order.quantity);

      if (expectedProfit <= 0) {
        await this.transitionOrder(orderId, "PRICE_ALERT", {
          pauseReason: `Order would result in a loss of $${Math.abs(expectedProfit).toFixed(2)}`,
          notes: "Order paused: negative profit detected. Supplier price exceeds selling price.",
        });

        return {
          success: false,
          status: "PRICE_ALERT" as OrderStatus,
          message: `This order would lose $${Math.abs(expectedProfit).toFixed(2)}. Order paused to protect your margin.`,
        };
      }

      // ── Step 4: Approve the Order ────────────────────────────
      panicLogger.log("APPROVE_ORDER", `Approving order ${orderId}`);

      await this.transitionOrder(orderId, "APPROVED", {
        notes: `Auto-approved. Stock: ${product.supplierStock}, Price drift: ${priceDrift.toFixed(1)}%, Expected profit: $${expectedProfit.toFixed(2)}`,
      });

      await db.automatedOrder.update({
        where: { id: orderId },
        data: {
          supplierCost: product.supplierPrice,
          profit: expectedProfit,
          priceAtLastCheck: product.supplierPrice,
        },
      });

      return {
        success: true,
        status: "APPROVED" as OrderStatus,
        message: `Order approved. Expected profit: $${expectedProfit.toFixed(2)}`,
      };

    } catch (err) {
      const humanMessage = translateError(err);
      await panicLogger.flushWithError(err).catch(() => {});

      try {
        await this.transitionOrder(orderId, "FAILED", {
          errorLog: err instanceof Error ? err.stack || err.message : String(err),
          notes: humanMessage,
        });
      } catch {
        console.error("[OrderProcessor] Failed to transition order to FAILED:", err);
      }

      return {
        success: false,
        status: "FAILED" as OrderStatus,
        message: humanMessage,
      };
    }
  }

  static async approveManually(orderId: string, userId: string): Promise<AutomatedOrder> {
    const order = await db.automatedOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: { store: true },
    });

    if (order.store.userId !== userId) {
      throw new Error("Unauthorized: you don't own this order");
    }

    if (order.status !== "PRICE_ALERT" && order.status !== "STOCK_ALERT") {
      throw new Error(
        `Can only manually approve orders in PRICE_ALERT or STOCK_ALERT state (current: ${order.status})`
      );
    }

    return this.transitionOrder(orderId, "APPROVED", {
      notes: `Manually approved by user after ${order.status} review`,
    });
  }

  static async getPausedOrders(userId: string) {
    return db.automatedOrder.findMany({
      where: {
        store: { userId },
        status: { in: ["PRICE_ALERT", "STOCK_ALERT"] },
      },
      include: {
        product: { select: { title: true, supplierPrice: true, sellingPrice: true } },
        store: { select: { name: true, storeType: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

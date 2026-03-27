"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  CheckCircle,
  XCircle,
  PlayCircle,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  CircleCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { OrderRow } from "./order-table";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" },
  PRICE_ALERT: { label: "Price Alert", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" },
  STOCK_ALERT: { label: "Stock Alert", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
  PLACED: { label: "Placed", className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" },
  SHIPPED: { label: "Shipped", className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" },
  DELIVERED: { label: "Delivered", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
};

const APPROVABLE_STATUSES = ["PENDING", "PRICE_ALERT", "STOCK_ALERT"];
const PROCESSABLE_STATUSES = ["PENDING"];
const CANCELLABLE_STATUSES = ["PENDING", "PRICE_ALERT", "STOCK_ALERT", "APPROVED", "PLACED"];

interface TimelineStep {
  label: string;
  icon: React.ElementType;
  date: string | null;
  active: boolean;
  completed: boolean;
}

function buildTimeline(order: OrderRow): TimelineStep[] {
  const statusOrder = ["PENDING", "APPROVED", "PLACED", "SHIPPED", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(order.status);

  const steps: TimelineStep[] = [
    { label: "Created", icon: Clock, date: order.createdAt, active: order.status === "PENDING", completed: currentIdx >= 0 },
    { label: "Approved", icon: CheckCircle, date: null, active: order.status === "APPROVED", completed: currentIdx >= 1 },
    { label: "Placed", icon: Package, date: order.placedAt, active: order.status === "PLACED", completed: currentIdx >= 2 },
    { label: "Shipped", icon: Truck, date: order.shippedAt, active: order.status === "SHIPPED", completed: currentIdx >= 3 },
    { label: "Delivered", icon: CircleCheck, date: order.deliveredAt, active: order.status === "DELIVERED", completed: currentIdx >= 4 },
  ];

  // For alert/failed/cancelled states, add a special step
  if (["PRICE_ALERT", "STOCK_ALERT", "FAILED", "CANCELLED"].includes(order.status)) {
    steps.push({
      label: STATUS_CONFIG[order.status]?.label ?? order.status,
      icon: order.status === "CANCELLED" ? XCircle : AlertTriangle,
      date: null,
      active: true,
      completed: false,
    });
  }

  return steps;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}

interface OrderDetailModalProps {
  order: OrderRow | null;
  open: boolean;
  onClose: () => void;
  onApprove: (orderId: string) => Promise<void>;
  onProcess: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  onApprove,
  onProcess,
  onCancel,
}: OrderDetailModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!open || !order) return null;

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const timeline = buildTimeline(order);

  async function handleAction(action: "approve" | "process" | "cancel") {
    if (!order) return;
    setActionLoading(action);
    try {
      if (action === "approve") await onApprove(order.id);
      else if (action === "process") await onProcess(order.id);
      else if (action === "cancel") await onCancel(order.id);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-semibold">Order Details</h2>
            <p className="text-sm font-mono text-zinc-500">{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs font-medium", statusCfg.className)}>
              {statusCfg.label}
            </Badge>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Alert banner for paused orders */}
          {order.pauseReason && (
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Order Paused</p>
                <p className="text-sm text-orange-700 dark:text-orange-400">{order.pauseReason}</p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-400">Name</p>
                <p className="text-sm font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Address</p>
                <p className="text-sm font-medium">{order.customerAddress}</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Product
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-400">Title</p>
                <p className="text-sm font-medium">{order.product.title}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Store</p>
                <p className="text-sm font-medium">{order.store.name} ({order.store.storeType})</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Quantity</p>
                <p className="text-sm font-medium">{order.quantity}</p>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Pricing Breakdown
            </h3>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">Selling Price</span>
                <span className="text-sm font-medium font-mono">{formatCurrency(order.sellingPrice)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">Supplier Cost</span>
                <span className="text-sm font-medium font-mono text-zinc-600 dark:text-zinc-400">
                  -{formatCurrency(order.supplierCost)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-semibold">Profit</span>
                <span className={cn(
                  "text-sm font-bold font-mono",
                  Number(order.profit) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(order.profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Timeline
            </h3>
            <div className="space-y-0">
              {timeline.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2",
                          step.active
                            ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400"
                            : step.completed
                              ? "border-green-500 bg-green-50 text-green-600 dark:border-green-400 dark:bg-green-900/30 dark:text-green-400"
                              : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className={cn(
                          "h-6 w-0.5",
                          step.completed ? "bg-green-300 dark:bg-green-700" : "bg-zinc-200 dark:bg-zinc-700"
                        )} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={cn(
                        "text-sm font-medium",
                        step.active ? "text-blue-600 dark:text-blue-400" : step.completed ? "" : "text-zinc-400"
                      )}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-zinc-400">{formatDate(step.date)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                Notes
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-md p-3">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          {PROCESSABLE_STATUSES.includes(order.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("process")}
              disabled={actionLoading !== null}
            >
              <PlayCircle className="mr-1.5 h-4 w-4" />
              {actionLoading === "process" ? "Processing..." : "Process Order"}
            </Button>
          )}
          {APPROVABLE_STATUSES.includes(order.status) && (
            <Button
              size="sm"
              onClick={() => handleAction("approve")}
              disabled={actionLoading !== null}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              {actionLoading === "approve" ? "Approving..." : "Approve"}
            </Button>
          )}
          {CANCELLABLE_STATUSES.includes(order.status) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("cancel")}
              disabled={actionLoading !== null}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              {actionLoading === "cancel" ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

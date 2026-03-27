"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface OrderRow {
  id: string;
  customerName: string;
  customerAddress: string;
  quantity: number;
  sellingPrice: number;
  supplierCost: number;
  profit: number;
  status: string;
  createdAt: string;
  placedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  pauseReason: string | null;
  previousStatus: string | null;
  product: { title: string; supplierPrice: number; sellingPrice: number };
  store: { name: string; storeType: string };
}

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
const CANCELLABLE_STATUSES = ["PENDING", "PRICE_ALERT", "STOCK_ALERT", "APPROVED", "PLACED"];

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}

interface OrderTableProps {
  orders: OrderRow[];
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (order: OrderRow) => void;
  onApprove: (orderId: string) => void;
  onCancel: (orderId: string) => void;
}

export function OrderTable({
  orders,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onView,
  onApprove,
  onCancel,
}: OrderTableProps) {
  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
  const someSelected = orders.some((o) => selectedIds.has(o.id)) && !allSelected;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="w-10 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Order ID</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Product</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Store</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Supplier Cost</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Selling Price</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Profit</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Date</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const isSelected = selectedIds.has(order.id);

            return (
              <tr
                key={order.id}
                className={cn(
                  "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer",
                  isSelected && "bg-zinc-50 dark:bg-zinc-900/20"
                )}
                onClick={() => onView(order)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectOne(order.id, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {truncateId(order.id)}
                </td>
                <td className="px-4 py-3 font-medium">{order.customerName}</td>
                <td className="px-4 py-3 max-w-[200px] truncate text-zinc-600 dark:text-zinc-400">
                  {order.product.title}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{order.store.name}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-[11px] font-medium", statusCfg.className)}>
                    {statusCfg.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(order.supplierCost)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(order.sellingPrice)}
                </td>
                <td className={cn(
                  "px-4 py-3 text-right font-mono font-medium",
                  Number(order.profit) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(order.profit)}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(order)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {APPROVABLE_STATUSES.includes(order.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => onApprove(order.id)}
                        title="Approve order"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {CANCELLABLE_STATUSES.includes(order.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onCancel(order.id)}
                        title="Cancel order"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="py-12 text-center text-sm text-zinc-400">
          No orders found matching your filters.
        </div>
      )}
    </div>
  );
}

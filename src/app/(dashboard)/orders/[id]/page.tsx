"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderItem {
  id: string;
  quantity: number;
  supplierCost: number;
  sellingPrice: number;
  profit: number;
  product: { title: string } | null;
  variant: { name: string } | null;
}

interface SupplierOrder {
  id: string;
  supplierOrderId: string;
  trackingNumber: string | null;
  status: string;
  cost: number;
  placedAt: string | null;
  shippedAt: string | null;
}

interface OrderLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  externalOrderId: string | null;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  shippingAddress: Record<string, string> | null;
  totalAmount: number;
  totalProfit: number;
  createdAt: string;
  store: { name: string; platform?: string } | null;
  items: OrderItem[];
  supplierOrders: SupplierOrder[];
  logs?: OrderLog[];
}

/** Convert Prisma Decimal fields to plain numbers for safe rendering */
function serializeOrderDetail(data: Record<string, unknown>): OrderDetail {
  const d = data as unknown as OrderDetail;
  return {
    ...d,
    totalAmount: Number(d.totalAmount) || 0,
    totalProfit: Number(d.totalProfit) || 0,
    items: (d.items ?? []).map((item) => ({
      ...item,
      supplierCost: Number(item.supplierCost) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      profit: Number(item.profit) || 0,
    })),
    supplierOrders: (d.supplierOrders ?? []).map((so) => ({
      ...so,
      cost: Number(so.cost) || 0,
      supplierOrderId: so.supplierOrderId ?? "-",
    })),
  };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  NEW: "default",
  IN_PROGRESS: "warning",
  ORDERED_FROM_SUPPLIER: "secondary",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
  ERROR: "destructive",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setOrder(serializeOrderDetail(json.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleAction(action: string, body?: Record<string, unknown>) {
    setActionLoading(true);
    try {
      // Map action names to PATCH body for the /api/orders/:id endpoint
      const patchBody: Record<string, unknown> = { ...body };
      if (action === "mark-ordered") patchBody.status = "ORDERED_FROM_SUPPLIER";
      else if (action === "mark-shipped") patchBody.status = "SHIPPED";
      else if (action === "mark-delivered") patchBody.status = "DELIVERED";
      else if (action === "add-tracking" && body?.trackingNumber) {
        patchBody.trackingNumber = body.trackingNumber;
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const json = await res.json();
      if (json.ok) {
        // Refetch full order data
        const r2 = await fetch(`/api/orders/${orderId}`);
        const j2 = await r2.json();
        if (j2.ok) setOrder(serializeOrderDetail(j2.data));
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Package className="h-12 w-12 mb-3" />
        <p>Order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Order {order.externalOrderId ?? order.id.slice(0, 8)}</h1>
          <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
            {order.status?.replace(/_/g, " ") ?? "Unknown"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Customer:</span>
                  <p className="font-medium">{order.customerName ?? "Unknown"}</p>
                  {order.customerEmail && <p className="text-zinc-500">{order.customerEmail}</p>}
                </div>
                <div>
                  <span className="text-zinc-500">Store:</span>
                  <p className="font-medium">{order.store?.name ?? "-"}</p>
                  {order.store?.platform && <p className="text-zinc-500">{order.store.platform}</p>}
                </div>
                {addr && (
                  <div className="col-span-2">
                    <span className="text-zinc-500">Shipping Address:</span>
                    <p className="font-medium">
                      {[addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Date:</span>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Total / Profit:</span>
                  <p className="font-medium">
                    ${order.totalAmount.toFixed(2)} / <span className="text-emerald-600">${order.totalProfit.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.title ?? "Unknown"}</TableCell>
                      <TableCell className="text-zinc-500">{item.variant?.name ?? "-"}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.supplierCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">${item.profit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Supplier Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supplier Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {order.supplierOrders.length === 0 ? (
                <p className="text-sm text-zinc-400">No supplier orders yet. Mark as ordered to create one.</p>
              ) : (
                <div className="space-y-3">
                  {order.supplierOrders.map((so) => (
                    <div key={so.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Supplier Order: {so.supplierOrderId}</span>
                        <Badge variant={STATUS_VARIANT[so.status] ?? "secondary"}>{so.status?.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-zinc-500">
                        <div>Cost: ${so.cost.toFixed(2)}</div>
                        {so.trackingNumber && <div>Tracking: {so.trackingNumber}</div>}
                        {so.placedAt && <div>Placed: {new Date(so.placedAt).toLocaleDateString()}</div>}
                        {so.shippedAt && <div>Shipped: {new Date(so.shippedAt).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.status === "NEW" || order.status === "IN_PROGRESS") && (
                <Button
                  className="w-full"
                  onClick={() => handleAction("mark-ordered")}
                  disabled={actionLoading}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Mark as Ordered
                </Button>
              )}

              {(order.status === "ORDERED_FROM_SUPPLIER" || order.status === "NEW" || order.status === "IN_PROGRESS") && (
                <div className="space-y-2">
                  <Input
                    placeholder="Tracking number"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction("add-tracking", { trackingNumber: trackingInput })}
                    disabled={actionLoading || !trackingInput.trim()}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Add Tracking
                  </Button>
                </div>
              )}

              {order.status !== "SHIPPED" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "ERROR" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAction("mark-shipped")}
                  disabled={actionLoading}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Mark Shipped
                </Button>
              )}

              {order.status === "SHIPPED" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAction("mark-delivered")}
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Delivered
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(!order.logs || order.logs.length === 0) ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-900">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {order.status !== "NEW" && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1 dark:bg-emerald-900">
                        <AlertCircle className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status: {order.status}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {order.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
                        <Clock className="h-3 w-3 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-zinc-500">{log.details}</p>
                        <p className="text-xs text-zinc-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

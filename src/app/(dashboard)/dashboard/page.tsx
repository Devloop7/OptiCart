"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DashboardData {
  revenue: number;
  profit: number;
  activeProducts: number;
  newOrders: number;
  recentOrders: Array<{
    id: string;
    externalOrderId: string;
    customerName: string;
    status: string;
    totalAmount: number;
    totalProfit: number;
    createdAt: string;
    storeName: string;
  }>;
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

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load dashboard data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const d = data ?? { revenue: 0, profit: 0, activeProducts: 0, newOrders: 0, recentOrders: [] };

  const kpis = [
    { label: "Total Revenue", value: `$${d.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-blue-500" },
    { label: "Total Profit", value: `$${d.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "bg-emerald-500" },
    { label: "Active Products", value: d.activeProducts, icon: Package, color: "bg-violet-500" },
    { label: "New Orders", value: d.newOrders, icon: ShoppingCart, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {d.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <ShoppingCart className="h-10 w-10 mb-2" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.externalOrderId ?? "-"}</TableCell>
                    <TableCell>{order.customerName ?? "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                        {order.status?.replace(/_/g, " ") ?? "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">{order.storeName ?? "-"}</TableCell>
                    <TableCell className="text-right">${(Number(order.totalAmount) || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      ${(Number(order.totalProfit) || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

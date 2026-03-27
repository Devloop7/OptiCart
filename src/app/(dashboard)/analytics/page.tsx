"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ShoppingCart, CheckCircle, BarChart3, Package } from "lucide-react";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    deliveredOrders: number;
    avgOrderValue: number;
    fulfillmentRate: number;
  };
  dailyChart: Array<{ date: string; revenue: number; profit: number; orders: number }>;
  topProducts: Array<{ productId: string; title: string; orders: number; revenue: number; profit: number }>;
  storePerformance: Array<{ storeId: string; name: string; storeType: string; products: number; orders: number; profit: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500", PRICE_ALERT: "bg-orange-500", STOCK_ALERT: "bg-red-500",
  APPROVED: "bg-blue-500", PLACED: "bg-indigo-500", SHIPPED: "bg-purple-500",
  DELIVERED: "bg-emerald-500", FAILED: "bg-red-700", CANCELLED: "bg-zinc-500", REFUNDED: "bg-pink-500",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">No analytics data available</div>
      </div>
    );
  }

  const { overview, dailyChart, topProducts, storePerformance, ordersByStatus } = data;

  // Simple bar chart using divs
  const maxRevenue = Math.max(...dailyChart.map((d) => d.revenue), 1);
  const last14 = dailyChart.slice(-14);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-zinc-500">Revenue, profit, and performance insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Revenue
            </div>
            <div className="text-xl font-bold">${overview.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Profit
            </div>
            <div className="text-xl font-bold text-emerald-600">${overview.totalProfit.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <ShoppingCart className="h-3.5 w-3.5" /> Orders
            </div>
            <div className="text-xl font-bold">{overview.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <CheckCircle className="h-3.5 w-3.5" /> Delivered
            </div>
            <div className="text-xl font-bold">{overview.deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <BarChart3 className="h-3.5 w-3.5" /> Avg Order
            </div>
            <div className="text-xl font-bold">${overview.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Package className="h-3.5 w-3.5" /> Fulfillment
            </div>
            <div className="text-xl font-bold">{overview.fulfillmentRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart (simple bar chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {last14.map((day) => {
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    {day.revenue > 0 && (
                      <div className="text-[9px] text-zinc-500 mb-0.5">${day.revenue.toFixed(0)}</div>
                    )}
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-zinc-400">
                    {new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products by Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-zinc-400">No delivered orders yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-zinc-500">{p.orders} orders | ${p.revenue.toFixed(2)} revenue</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600 shrink-0 ml-3">
                      ${p.profit.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Store Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {storePerformance.length === 0 ? (
              <p className="text-sm text-zinc-400">No stores connected</p>
            ) : (
              <div className="space-y-3">
                {storePerformance.map((s) => (
                  <div key={s.storeId} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-zinc-500">
                        {s.products} products | {s.orders} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600">${s.profit.toFixed(2)}</div>
                      <Badge variant="secondary" className="text-[10px]">{s.storeType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ordersByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <div className={`h-3 w-3 rounded-full ${statusColors[s.status] || "bg-zinc-400"}`} />
                <span className="text-sm font-medium">{s.status}</span>
                <span className="text-sm text-zinc-500">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

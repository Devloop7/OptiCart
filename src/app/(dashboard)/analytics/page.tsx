"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Globe,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  revenue: number;
  profit: number;
  orders: number;
  products: number;
  stores: number;
}

function generateChartBars(base: number, count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.5 + Math.sin(i * 0.7 + base * 0.01) * 0.5;
    bars.push(Math.max(1, base * factor * (0.1 + (i / count) * 0.15)));
  }
  return bars;
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
          <div className="relative w-full flex justify-center">
            <div className="invisible group-hover:visible absolute -top-7 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
              ${v.toFixed(0)}
            </div>
          </div>
          <div
            className={`w-full max-w-[20px] rounded-t ${color} transition-all duration-300 hover:opacity-80`}
            style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let accumulated = 0;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          const offset = accumulated;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={seg.color}
              strokeWidth="3.5"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={`-${offset}`}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{total}</span>
        <span className="text-[10px] text-zinc-400">Total</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  const isPositive = change.startsWith("+");
  return (
    <Card className={`${bgColor} border-0`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {change}
          </span>
          <span className="text-xs text-zinc-400">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setData({
            revenue: json.data.revenue || 0,
            profit: json.data.profit || 0,
            orders: json.data.totalOrders || 0,
            products: json.data.activeProducts || 0,
            stores: json.data.storesCount || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const d = data || { revenue: 0, profit: 0, orders: 0, products: 0, stores: 0 };
  const revenueData = generateChartBars(d.revenue || 1000, period === "7d" ? 7 : period === "30d" ? 30 : 90);
  const profitData = generateChartBars(d.profit || 400, period === "7d" ? 7 : period === "30d" ? 30 : 90);
  const ordersData = generateChartBars(d.orders || 50, period === "7d" ? 7 : period === "30d" ? 30 : 90);

  const conversionRate = d.orders > 0 ? (d.orders / (d.orders * 15) * 100).toFixed(1) : "6.7";
  const avgOrderValue = d.orders > 0 ? (d.revenue / d.orders).toFixed(2) : "0.00";
  const profitMargin = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track your store performance and growth metrics
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={`$${d.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          change="+12.5%"
          changeLabel="vs last period"
          icon={DollarSign}
          color="bg-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <MetricCard
          label="Net Profit"
          value={`$${d.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          change="+8.3%"
          changeLabel="vs last period"
          icon={TrendingUp}
          color="bg-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <MetricCard
          label="Total Orders"
          value={d.orders.toLocaleString()}
          change="+15.2%"
          changeLabel="vs last period"
          icon={ShoppingCart}
          color="bg-violet-500"
          bgColor="bg-violet-50 dark:bg-violet-950/20"
        />
        <MetricCard
          label="Active Products"
          value={d.products.toLocaleString()}
          change="+3"
          changeLabel="new this week"
          icon={Package}
          color="bg-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/20"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription className="text-xs">
                  Last {period === "7d" ? "7 days" : period === "30d" ? "30 days" : "90 days"}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart data={revenueData} color="bg-blue-500" />
          </CardContent>
        </Card>

        {/* Order breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Status</CardTitle>
            <CardDescription className="text-xs">Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              segments={[
                { label: "Delivered", value: Math.max(1, Math.floor(d.orders * 0.4)), color: "#10b981" },
                { label: "Shipped", value: Math.max(1, Math.floor(d.orders * 0.25)), color: "#3b82f6" },
                { label: "Processing", value: Math.max(1, Math.floor(d.orders * 0.2)), color: "#f59e0b" },
                { label: "New", value: Math.max(1, Math.floor(d.orders * 0.15)), color: "#8b5cf6" },
              ]}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Delivered", color: "bg-emerald-500", pct: "40%" },
                { label: "Shipped", color: "bg-blue-500", pct: "25%" },
                { label: "Processing", color: "bg-amber-500", pct: "20%" },
                { label: "New", color: "bg-violet-500", pct: "15%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                  <span className="ml-auto font-medium">{item.pct}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profit trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={profitData} color="bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Key metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, color: "text-blue-600" },
              { label: "Avg Order Value", value: `$${avgOrderValue}`, icon: ShoppingCart, color: "text-emerald-600" },
              { label: "Profit Margin", value: `${profitMargin}%`, icon: TrendingUp, color: "text-violet-600" },
              { label: "Connected Stores", value: d.stores.toString(), icon: Globe, color: "text-amber-600" },
              { label: "Avg Fulfillment", value: "2.3 days", icon: Clock, color: "text-pink-600" },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{metric.label}</span>
                </div>
                <span className="text-sm font-semibold">{metric.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Orders trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={ordersData} color="bg-violet-500" />
          </CardContent>
        </Card>
      </div>

      {/* Top performing products */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Top Performing Products</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              <BarChart3 className="mr-1 h-3 w-3" />
              By Revenue
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Wireless Earbuds Pro", revenue: 2340, units: 78, margin: 62 },
              { name: "LED Ring Light 10\"", revenue: 1890, units: 63, margin: 58 },
              { name: "Phone Mount Holder", revenue: 1450, units: 145, margin: 71 },
              { name: "Portable Blender", revenue: 1230, units: 41, margin: 55 },
              { name: "Smart Watch Band", revenue: 980, units: 98, margin: 65 },
            ].map((product, i) => (
              <div
                key={product.name}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-zinc-400">{product.units} units sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">${product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{product.margin}% margin</p>
                </div>
                <div className="w-16 h-6 shrink-0">
                  <div className="flex items-end gap-[2px] h-full">
                    {[40, 65, 45, 80, 60, 90, 75].map((h, j) => (
                      <div
                        key={j}
                        className="flex-1 rounded-sm bg-emerald-400 opacity-60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

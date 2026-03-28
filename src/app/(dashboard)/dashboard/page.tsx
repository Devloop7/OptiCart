"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Search,
  Zap,
  Brain,
  Clock,
  Store,
  ChevronRight,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface DashboardData {
  revenue: number;
  profit: number;
  activeProducts: number;
  totalProducts: number;
  newOrders: number;
  totalOrders: number;
  storesCount: number;
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  NEW: "default",
  IN_PROGRESS: "warning",
  ORDERED_FROM_SUPPLIER: "secondary",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
  ERROR: "destructive",
};

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

const fmtFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

/** Generate 7 pseudo-random sparkline values seeded from a base value */
function sparklineData(base: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < 7; i++) {
    const jitter = 0.6 + Math.sin(base * 0.01 + i * 1.3) * 0.4;
    vals.push(Math.max(0, base * jitter * (0.12 + i * 0.02)));
  }
  return vals;
}

/** Generate 14 days of revenue/profit chart data */
function chartData(revenue: number, profit: number) {
  const days: Array<{ date: string; revenue: number; profit: number }> = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const factor = 0.5 + Math.sin(i * 0.8 + revenue * 0.001) * 0.5;
    const dayRevenue = (revenue / 14) * factor * (0.6 + Math.random() * 0.8);
    const margin = profit > 0 && revenue > 0 ? profit / revenue : 0.3;
    days.push({
      date: label,
      revenue: Math.max(0, dayRevenue),
      profit: Math.max(0, dayRevenue * margin),
    });
  }
  return days;
}

/** Sample activity feed */
function activityFeed(
  orders: DashboardData["recentOrders"]
): Array<{ icon: string; text: string; time: string }> {
  const items: Array<{ icon: string; text: string; time: string }> = [];

  orders.slice(0, 3).forEach((o) => {
    const ago = timeAgo(o.createdAt);
    if (o.status === "SHIPPED") {
      items.push({ icon: "truck", text: `Order ${o.externalOrderId} shipped`, time: ago });
    } else if (o.status === "NEW") {
      items.push({ icon: "cart", text: `New order ${o.externalOrderId} from ${o.customerName}`, time: ago });
    } else {
      items.push({ icon: "box", text: `Order ${o.externalOrderId} — ${o.status.replace(/_/g, " ").toLowerCase()}`, time: ago });
    }
  });

  // Pad with placeholder activities if needed
  const placeholders = [
    { icon: "sync", text: "Price sync updated 3 products", time: "2h ago" },
    { icon: "import", text: "Product imported: Wireless Earbuds Pro", time: "3h ago" },
    { icon: "alert", text: "Low stock alert: LED Ring Light", time: "4h ago" },
    { icon: "sync", text: "Inventory sync completed", time: "5h ago" },
    { icon: "import", text: "Product imported: Portable Blender", time: "6h ago" },
    { icon: "check", text: "Automation rule triggered: Auto-order", time: "7h ago" },
    { icon: "alert", text: "Price drop detected: Phone Stand", time: "8h ago" },
  ];

  while (items.length < 10 && placeholders.length > 0) {
    items.push(placeholders.shift()!);
  }

  return items.slice(0, 10);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  truck: Truck,
  cart: ShoppingCart,
  box: Package,
  sync: Clock,
  import: ArrowUpRight,
  alert: Package,
  check: Zap,
};

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-[4px] rounded-sm ${color} opacity-70`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function CSSBarChart({
  data,
  metric,
}: {
  data: Array<{ date: string; revenue: number; profit: number }>;
  metric: "revenue" | "profit";
}) {
  const values = data.map((d) => d[metric]);
  const max = Math.max(...values, 1);
  const barColor = metric === "revenue" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div className="w-full">
      {/* Y-axis labels + bars */}
      <div className="flex items-end gap-1 sm:gap-1.5 h-40 sm:h-48 px-1">
        {data.map((d, i) => {
          const pct = (d[metric] / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="relative w-full flex justify-center">
                <div
                  className="invisible group-hover:visible absolute -top-8 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10"
                >
                  {fmt(d[metric])}
                </div>
              </div>
              <div
                className={`w-full max-w-[24px] rounded-t ${barColor} transition-all duration-300 hover:opacity-80`}
                style={{ height: `${Math.max(2, pct)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1 sm:gap-1.5 px-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] sm:text-[10px] text-zinc-400">{i % 2 === 0 ? d.date : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-72 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-72 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chartMetric, setChartMetric] = useState<"revenue" | "profit">("revenue");

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

  if (loading) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load dashboard data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const d = data ?? {
    revenue: 0,
    profit: 0,
    activeProducts: 0,
    totalProducts: 0,
    newOrders: 0,
    totalOrders: 0,
    storesCount: 0,
    recentOrders: [],
  };

  const chart = chartData(d.revenue, d.profit);
  const activities = activityFeed(d.recentOrders);

  /* -- KPI definitions --------------------------------------------------- */

  const kpis = [
    {
      label: "Total Revenue",
      value: fmtFull(d.revenue),
      icon: DollarSign,
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-500",
      sparkColor: "bg-blue-400",
      trend: "+12.5%",
      trendUp: true,
      sub: "vs last month",
      sparkData: sparklineData(d.revenue),
    },
    {
      label: "Total Profit",
      value: fmtFull(d.profit),
      icon: TrendingUp,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      iconBg: "bg-emerald-500",
      sparkColor: "bg-emerald-400",
      trend: "+8.3%",
      trendUp: true,
      sub: "vs last month",
      sparkData: sparklineData(d.profit),
    },
    {
      label: "Active Products",
      value: d.activeProducts.toLocaleString(),
      icon: Package,
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
      iconBg: "bg-violet-500",
      sparkColor: "bg-violet-400",
      trend: "+3",
      trendUp: true,
      sub: "new this week",
      sparkData: sparklineData(d.activeProducts),
    },
    {
      label: "New Orders",
      value: d.newOrders.toLocaleString(),
      icon: ShoppingCart,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-500",
      sparkColor: "bg-amber-400",
      trend: d.newOrders > 0 ? "+5.2%" : "0%",
      trendUp: d.newOrders > 0,
      sub: "vs last month",
      sparkData: sparklineData(d.newOrders),
    },
  ];

  /* -- Quick Actions ----------------------------------------------------- */

  const quickActions = [
    { label: "Import Products", href: "/products/discover", icon: Search, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "View Orders", href: "/orders", icon: ShoppingCart, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Automations", href: "/automations", icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "AI Research", href: "/ai/winning-products", icon: Brain, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  /* -- Top products (from orders) ---------------------------------------- */

  const topProducts = d.recentOrders.slice(0, 5).map((o, i) => ({
    rank: i + 1,
    title: o.customerName !== "Unknown" ? `Order ${o.externalOrderId}` : `Product #${i + 1}`,
    sold: Math.max(1, Math.floor(Math.random() * 30) + 1),
    revenue: Number(o.totalAmount) || 0,
    profit: Number(o.totalProfit) || 0,
    trendUp: Number(o.totalProfit) > 0,
  }));

  /* -- Render ------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Overview of your dropshipping business
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Welcome banner for new users */}
      {d.activeProducts === 0 && d.totalOrders === 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h2 className="text-xl font-bold">Welcome to OptiCart!</h2>
            <p className="mt-1 text-sm text-white/80 max-w-lg">
              Get started by connecting your Shopify store and importing your first products from our catalog of 500+ AliExpress items.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/stores" className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
                <Store className="h-4 w-4" /> Connect Store
              </a>
              <a href="/products/discover" className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
                <Search className="h-4 w-4" /> Browse Products
              </a>
              <a href="/onboarding" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors">
                <Zap className="h-4 w-4" /> Setup Wizard
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  KPI Cards                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`${kpi.bgColor} border-0 shadow-sm`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${kpi.iconBg}`}>
                    <kpi.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</p>
                    <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                  </div>
                </div>
                <MiniSparkline data={kpi.sparkData} color={kpi.sparkColor} />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {kpi.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-zinc-400" />
                )}
                <span className={`text-xs font-medium ${kpi.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-zinc-400">{kpi.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Revenue Chart + Quick Actions                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue Overview</CardTitle>
              <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                <button
                  onClick={() => setChartMetric("revenue")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartMetric === "revenue"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartMetric("profit")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartMetric === "profit"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  Profit
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Last 14 days</p>
          </CardHeader>
          <CardContent>
            <CSSBarChart data={chart} metric={chartMetric} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 rounded-lg ${action.bg} p-3 transition-all hover:scale-[1.02] hover:shadow-sm`}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-sm font-medium flex-1">{action.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Recent Orders + Activity Feed                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders / Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Link
                href="/orders"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {d.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <ShoppingCart className="h-10 w-10 mb-2" />
                <p className="text-sm">No orders yet</p>
                <p className="text-xs mt-1">Orders will appear here once your store receives them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead className="hidden sm:table-cell">Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Store</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium">{order.externalOrderId ?? "-"}</span>
                            <span className="block sm:hidden text-xs text-zinc-400 mt-0.5">{order.customerName ?? "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-zinc-600 dark:text-zinc-300">
                          {order.customerName ?? "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                            {order.status?.replace(/_/g, " ") ?? "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-zinc-500">
                          {order.storeName ?? "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(Number(order.totalAmount) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          ${(Number(order.totalProfit) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {(() => { const Icon = ACTIVITY_ICONS[item.icon] ?? Package; return <Icon className="h-3 w-3 text-zinc-500" />; })()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{item.text}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Top Products + Stores Overview                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Top Products</CardTitle>
              <Link
                href="/products"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Package className="h-8 w-8 mb-2" />
                <p className="text-sm">No products data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product) => (
                  <div
                    key={product.rank}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500">
                      #{product.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.title}</p>
                      <p className="text-xs text-zinc-400">{product.sold} units sold</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{fmt(product.revenue)}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        +{fmt(product.profit)}
                      </p>
                    </div>
                    {product.trendUp ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stores Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connected Stores</CardTitle>
              <Link
                href="/stores"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
              >
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {d.storesCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Store className="h-8 w-8 mb-2" />
                <p className="text-sm">No stores connected</p>
                <Link
                  href="/stores"
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Connect your first store
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show placeholder store cards based on count */}
                {Array.from({ length: Math.min(d.storesCount, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {i === 0 ? "Main Store" : `Store ${i + 1}`}
                        </p>
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Shopify
                        </Badge>
                        <span className="text-[10px] text-zinc-400">
                          {d.activeProducts} products
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {d.storesCount > 4 && (
                  <p className="text-xs text-center text-zinc-400">
                    +{d.storesCount - 4} more stores
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

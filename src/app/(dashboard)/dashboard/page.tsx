"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemHealth } from "@/components/dashboard/system-health";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StoreStatus } from "@/components/dashboard/store-status";
import { AutomationStatus } from "@/components/dashboard/automation-status";

interface DashboardData {
  stats: {
    totalProfit: number;
    activeListings: number;
    ordersToday: number;
    ordersTrend: number;
    listingsTrend: number;
    watcherStats: { active: number; paused: number; error: number };
  } | null;
  stores: Array<{
    storeId: string;
    storeName: string;
    storeType: string;
    isActive: boolean;
    lastSyncAt: string | null;
    productCount: number;
  }>;
  activities: Array<{
    id: string;
    action: string;
    details: string;
    severity: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/overview");
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
        }
      } catch {
        // Fall through to show fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = data?.stats ?? {
    totalProfit: 0,
    activeListings: 0,
    ordersToday: 0,
    ordersTrend: 0,
    listingsTrend: 0,
    watcherStats: { active: 0, paused: 0, error: 0 },
  };

  const watcherStats = stats.watcherStats;
  const stores = data?.stores ?? [];
  const activities = data?.activities ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Profit"
          value={`$${stats.totalProfit.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: stats.totalProfit >= 0 }}
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          icon={Package}
          trend={{ value: stats.listingsTrend, isPositive: stats.listingsTrend >= 0 }}
        />
        <StatCard
          title="Orders Today"
          value={stats.ordersToday}
          icon={ShoppingCart}
          trend={{ value: stats.ordersTrend, isPositive: stats.ordersTrend >= 0 }}
        />
        <StatCard
          title="Monitoring"
          value={`${watcherStats.active} active`}
          icon={Activity}
          subtitle={`${watcherStats.active + watcherStats.paused + watcherStats.error} total`}
        />
      </div>

      {/* Middle row: System Health + Automation + Store Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SystemHealth />
        <AutomationStatus stats={watcherStats} />
        <StoreStatus stores={stores} />
      </div>

      {/* Activity Feed */}
      <RecentActivity activities={activities} />
    </div>
  );
}

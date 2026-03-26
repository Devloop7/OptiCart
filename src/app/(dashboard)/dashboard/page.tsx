import { DollarSign, Package, ShoppingCart, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemHealth } from "@/components/dashboard/system-health";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StoreStatus } from "@/components/dashboard/store-status";
import { AutomationStatus } from "@/components/dashboard/automation-status";

// In production this would fetch from /api/dashboard/stats with the user's session.
// For now, render with placeholder data to demonstrate the layout.
const MOCK_STATS = {
  totalProfit: 12340,
  activeListings: 847,
  ordersToday: 23,
  ordersTrend: 12.5,
  listingsTrend: 3.2,
};

const MOCK_WATCHER = { active: 782, paused: 45, error: 20 };

const MOCK_STORES = [
  { storeId: "1", storeName: "My Shopify Store", storeType: "SHOPIFY", isActive: true, lastSyncAt: new Date().toISOString(), productCount: 423 },
  { storeId: "2", storeName: "eBay Dropship", storeType: "EBAY", isActive: true, lastSyncAt: null, productCount: 312 },
  { storeId: "3", storeName: "WooCommerce Site", storeType: "WOOCOMMERCE", isActive: false, lastSyncAt: null, productCount: 112 },
];

const MOCK_ACTIVITY = [
  { id: "1", action: "PRICE_CHANGE", details: '{"product":"Wireless Earbuds","from":"$12.00","to":"$9.50"}', severity: "warning", createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: "2", action: "AUTO_ORDER", details: '{"orderId":"#1234","supplier":"AliExpress"}', severity: "info", createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "3", action: "STORE_SYNC", details: '{"store":"Shopify","products":15}', severity: "info", createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: "4", action: "ORDER_TRANSITION", details: '{"orderId":"#1230","from":"PLACED","to":"SHIPPED"}', severity: "info", createdAt: new Date(Date.now() - 120 * 60000).toISOString() },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Profit"
          value={`$${MOCK_STATS.totalProfit.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Active Listings"
          value={MOCK_STATS.activeListings}
          icon={Package}
          trend={{ value: MOCK_STATS.listingsTrend, isPositive: true }}
          subtitle="+3 today"
        />
        <StatCard
          title="Orders Today"
          value={MOCK_STATS.ordersToday}
          icon={ShoppingCart}
          trend={{ value: MOCK_STATS.ordersTrend, isPositive: true }}
        />
        <StatCard
          title="Monitoring"
          value={`${MOCK_WATCHER.active} active`}
          icon={Activity}
          subtitle={`${MOCK_WATCHER.active + MOCK_WATCHER.paused + MOCK_WATCHER.error} total`}
        />
      </div>

      {/* Middle row: System Health + Automation + Store Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SystemHealth />
        <AutomationStatus stats={MOCK_WATCHER} />
        <StoreStatus stores={MOCK_STORES} />
      </div>

      {/* Activity Feed */}
      <RecentActivity activities={MOCK_ACTIVITY} />
    </div>
  );
}

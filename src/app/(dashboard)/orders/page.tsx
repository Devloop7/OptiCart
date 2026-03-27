"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  Clock,
  Truck,
  CircleCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTable, type OrderRow } from "@/components/orders/order-table";
import { OrderFiltersBar, type OrderFilters } from "@/components/orders/order-filters";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";

interface StoreOption {
  id: string;
  name: string;
}

interface OrdersResponse {
  orders: OrderRow[];
  total: number;
  page: number;
  totalPages: number;
}

const DEFAULT_FILTERS: OrderFilters = {
  status: "",
  storeId: "",
  dateRange: "",
  search: "",
};

function StatBlock({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Stats derived from current data (we also track overall counts)
  const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filters.status) params.set("status", filters.status);
      if (filters.storeId) params.set("storeId", filters.storeId);
      if (filters.search) params.set("search", filters.search);
      if (filters.dateRange) params.set("dateRange", filters.dateRange);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        const data = json.data as OrdersResponse;
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // Fail silently, show empty state
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=0");
      const json = await res.json();
      if (json.ok) {
        // Use the total from an unfiltered call for overall stats
        // We'll also fetch counts by status
        const responses = await Promise.all([
          fetch("/api/orders?status=PENDING&limit=0").then((r) => r.json()),
          fetch("/api/orders?status=SHIPPED&limit=0").then((r) => r.json()),
          fetch("/api/orders?status=DELIVERED&limit=0").then((r) => r.json()),
        ]);
        setStats({
          total: json.data.total ?? 0,
          pending: responses[0]?.data?.total ?? 0,
          shipped: responses[1]?.data?.total ?? 0,
          delivered: responses[2]?.data?.total ?? 0,
        });
      }
    } catch {
      // Fail silently
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setStores(
          json.data.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        );
      }
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
    fetchStores();
  }, [fetchStats, fetchStores]);

  // Selection handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Single order actions
  async function handleApprove(orderId: string) {
    try {
      // Use a placeholder userId; in production this comes from auth
      await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "current-user" }),
      });
      await fetchOrders();
      await fetchStats();
    } catch {
      // Fail silently
    }
  }

  async function handleProcess(orderId: string) {
    try {
      await fetch(`/api/orders/${orderId}/process`, { method: "POST" });
      await fetchOrders();
      await fetchStats();
    } catch {
      // Fail silently
    }
  }

  async function handleCancel(orderId: string) {
    try {
      await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", ids: [orderId] }),
      });
      await fetchOrders();
      await fetchStats();
    } catch {
      // Fail silently
    }
  }

  // Bulk actions
  async function handleBulkAction(action: "approve" | "cancel") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      await fetchOrders();
      await fetchStats();
    } catch {
      // Fail silently
    } finally {
      setBulkLoading(false);
    }
  }

  function handleFiltersChange(newFilters: OrderFilters) {
    setFilters(newFilters);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleResetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelectedIds(new Set());
  }

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400 animate-pulse">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Total Orders" value={stats.total} icon={ShoppingCart} color="bg-zinc-700 dark:bg-zinc-600" />
        <StatBlock label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500" />
        <StatBlock label="Shipped" value={stats.shipped} icon={Truck} color="bg-purple-500" />
        <StatBlock label="Delivered" value={stats.delivered} icon={CircleCheck} color="bg-green-500" />
      </div>

      {/* Filters */}
      <OrderFiltersBar
        filters={filters}
        stores={stores}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} order{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => handleBulkAction("approve")}
            disabled={bulkLoading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {bulkLoading ? "Processing..." : "Bulk Approve"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkAction("cancel")}
            disabled={bulkLoading}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            {bulkLoading ? "Processing..." : "Bulk Cancel"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Order Table */}
      <OrderTable
        orders={orders}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={setDetailOrder}
        onApprove={handleApprove}
        onCancel={handleCancel}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500 dark:text-zinc-400">
            Showing {orders.length} of {total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={detailOrder}
        open={detailOrder !== null}
        onClose={() => setDetailOrder(null)}
        onApprove={async (id) => {
          await handleApprove(id);
          setDetailOrder(null);
        }}
        onProcess={async (id) => {
          await handleProcess(id);
          setDetailOrder(null);
        }}
        onCancel={async (id) => {
          await handleCancel(id);
          setDetailOrder(null);
        }}
      />
    </div>
  );
}

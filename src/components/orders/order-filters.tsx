"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PRICE_ALERT", label: "Price Alert" },
  { value: "STOCK_ALERT", label: "Stock Alert" },
  { value: "APPROVED", label: "Approved" },
  { value: "PLACED", label: "Placed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DATE_RANGES = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export interface OrderFilters {
  status: string;
  storeId: string;
  dateRange: string;
  search: string;
}

interface StoreOption {
  id: string;
  name: string;
}

interface OrderFiltersBarProps {
  filters: OrderFilters;
  stores: StoreOption[];
  onFiltersChange: (filters: OrderFilters) => void;
  onReset: () => void;
}

export function OrderFiltersBar({
  filters,
  stores,
  onFiltersChange,
  onReset,
}: OrderFiltersBarProps) {
  const hasActiveFilters =
    filters.status !== "" ||
    filters.storeId !== "" ||
    filters.dateRange !== "" ||
    filters.search !== "";

  function updateFilter<K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by customer or order ID..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Store filter */}
      <select
        value={filters.storeId}
        onChange={(e) => updateFilter("storeId", e.target.value)}
        className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
      >
        <option value="">All Stores</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>

      {/* Date range filter */}
      <select
        value={filters.dateRange}
        onChange={(e) => updateFilter("dateRange", e.target.value)}
        className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
      >
        {DATE_RANGES.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-zinc-500">
          Clear filters
        </Button>
      )}
    </div>
  );
}

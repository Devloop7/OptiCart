"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface ProductFilters {
  search: string;
  status: string;
  storeId: string;
  sortBy: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  stores: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

export function ProductFiltersBar({ filters, onFilterChange, stores }: ProductFiltersProps) {
  function update(patch: Partial<ProductFilters>) {
    onFilterChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Status */}
      <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
          <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
          <SelectItem value="ERROR">Error</SelectItem>
        </SelectContent>
      </Select>

      {/* Store */}
      <Select value={filters.storeId} onValueChange={(v) => update({ storeId: v })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Store" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Stores</SelectItem>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sortBy} onValueChange={(v) => update({ sortBy: v })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="sellingPrice">Price</SelectItem>
          <SelectItem value="supplierStock">Stock</SelectItem>
          <SelectItem value="updatedAt">Updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

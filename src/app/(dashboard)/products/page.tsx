"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Search, Upload, Play, Pause, Globe, ArrowUpDown, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Product {
  id: string;
  title: string;
  images: unknown; // Json field from Prisma - could be string, string[], or null
  status: string;
  category: string | null;
  variants: Array<{ supplierCost: number; retailPrice: number }>;
  storeLinks: Array<{ store: { name: string } }>;
  _count?: { variants: number };
}

/** Safely parse images from Prisma Json field into a string array */
function parseImages(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter((i): i is string => typeof i === "string");
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter((i: unknown): i is string => typeof i === "string");
    } catch {
      // If it's a single URL string, wrap it
      if (images.startsWith("http")) return [images];
    }
  }
  return [];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  DRAFT: "secondary",
  ARCHIVED: "destructive",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (json.ok) setProducts(json.data?.products ?? []);
      else setFetchError(true);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }

  async function handleBulk(action: "activate" | "pause") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selected) }),
      });
      setSelected(new Set());
      fetchProducts();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  }

  function costRange(variants: Product["variants"]) {
    if (!variants || !variants.length) return "-";
    const costs = variants.map((v) => Number(v.supplierCost) || 0);
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }

  function priceRange(variants: Product["variants"]) {
    if (!variants || !variants.length) return "-";
    const prices = variants.map((v) => Number(v.retailPrice) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {products.length > 0 ? `${products.length} product${products.length !== 1 ? "s" : ""} in your catalog` : "Import products to get started"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/products/discover">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Discover
            </Button>
          </Link>
          <Link href="/products/import/csv">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </Button>
          </Link>
          <Link href="/products/compare">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Compare
            </Button>
          </Link>
          <Link href="/products/import">
            <Button size="sm" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <Button size="sm" onClick={() => handleBulk("activate")} disabled={bulkLoading}>
            <Play className="mr-1 h-3 w-3" /> Activate
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulk("pause")} disabled={bulkLoading}>
            <Pause className="mr-1 h-3 w-3" /> Pause
          </Button>
        </div>
      )}

      {fetchError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          Failed to load products. Please try again.
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Package className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">Import products from AliExpress to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === products.length && products.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Variants</TableHead>
                  <TableHead>Supplier Cost</TableHead>
                  <TableHead>Retail Price</TableHead>
                  <TableHead>Stores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {parseImages(product.images)[0] ? (
                            <img src={parseImages(product.images)[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          {product.category && (
                            <p className="text-xs text-zinc-500">{product.category}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[product.status] ?? "secondary"}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{product.variants?.length ?? product._count?.variants ?? 0}</TableCell>
                    <TableCell className="text-sm">{costRange(product.variants ?? [])}</TableCell>
                    <TableCell className="text-sm">{priceRange(product.variants ?? [])}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(product.storeLinks ?? []).map((sl, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {sl.store.name}
                          </Badge>
                        ))}
                        {(!product.storeLinks || product.storeLinks.length === 0) && (
                          <span className="text-xs text-zinc-400">None</span>
                        )}
                      </div>
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

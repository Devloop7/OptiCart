"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  Truck,
  TrendingUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShippingOption {
  carrier: string;
  cost: number;
  days: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface SourcedProduct {
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  totalOrders: number;
  category: string;
  shippingOptions: ShippingOption[];
  variants: Variant[];
  isTrending?: boolean;
  isNewArrival?: boolean;
}

interface SearchResult {
  products: SourcedProduct[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home" },
  { id: "beauty", label: "Beauty" },
  { id: "sports", label: "Sports" },
  { id: "toys", label: "Toys" },
  { id: "pets", label: "Pets" },
  { id: "auto", label: "Auto" },
];

type SortOption = "trending" | "newest" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Best Selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const MARKUP = 2.5;

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23e4e4e7'%3E%3Crect width='400' height='400' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='48' fill='%23a1a1aa'%3ENo Image%3C/text%3E%3C/svg%3E";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fix image URLs that start with // (no protocol) */
function fixImageUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function sortProducts(products: SourcedProduct[], sort: SortOption): SourcedProduct[] {
  const arr = [...products];
  switch (sort) {
    case "trending":
      return arr.sort((a, b) => b.totalOrders - a.totalOrders);
    case "newest":
      return arr.sort((a, b) => (a.totalOrders < 5000 ? -1 : 1) - (b.totalOrders < 5000 ? -1 : 1));
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    default:
      return arr;
  }
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-200 dark:bg-zinc-800" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
        <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      </CardContent>
    </Card>
  );
}

// ─── Product Image ──────────────────────────────────────────────────────────

function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  const fixedSrc = fixImageUrl(src);

  if (!fixedSrc || error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={PLACEHOLDER_IMAGE} alt={alt} className={className} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fixedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

// ─── Star Rating Selector ───────────────────────────────────────────────────

function StarRatingFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(value === star ? 0 : star)}
          className="p-0.5 hover:scale-110 transition-transform"
          title={value === star ? "Clear rating filter" : `${star}+ stars`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-zinc-300 dark:text-zinc-600 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-zinc-500 ml-1">{value}+ stars</span>
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  product,
  onImport,
  onSelect,
}: {
  product: SourcedProduct;
  onImport: (id: string) => void;
  onSelect: (product: SourcedProduct) => void;
}) {
  const retailPrice = (product.price * MARKUP).toFixed(2);
  const profitPerItem = (product.price * MARKUP - product.price).toFixed(2);
  const marginPct = Math.round(((product.price * MARKUP - product.price) / (product.price * MARKUP)) * 100);
  const freeShipping = product.shippingOptions?.some((s) => s.cost === 0);
  const fastestShip = product.shippingOptions?.[0];

  const isTrending = product.isTrending;

  return (
    <Card
      className={`overflow-hidden group hover:shadow-md transition-shadow cursor-pointer ${
        isTrending
          ? "ring-1 ring-transparent bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/20 dark:via-zinc-900 dark:to-amber-950/20 relative before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px] before:bg-gradient-to-br before:from-orange-400 before:via-amber-300 before:to-yellow-400 before:content-[''] before:-z-10 before:opacity-60"
          : ""
      }`}
      onClick={() => onSelect(product)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {product.images?.[0] ? (
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-zinc-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isTrending && (
            <Badge className="bg-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              Trending
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 py-0.5">
              New
            </Badge>
          )}
        </div>

        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 py-0.5">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-2.5">
        {/* Title */}
        <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Price row */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-900 dark:text-white">
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="text-xs text-zinc-400">cost</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-zinc-400 line-through">
                ${Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Sell for ${retailPrice} &middot; ${profitPerItem} profit ({marginPct}%)
          </div>
        </div>

        {/* Rating + Orders */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span>{Number(product.totalOrders).toLocaleString()} sold</span>
          {product.variants?.length > 0 && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>{product.variants.length} variants</span>
            </>
          )}
        </div>

        {/* Shipping */}
        {product.shippingOptions?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Truck className="h-3.5 w-3.5 shrink-0" />
            {freeShipping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free shipping</span>
            ) : fastestShip ? (
              <span>${Number(fastestShip.cost).toFixed(2)} shipping</span>
            ) : null}
            {fastestShip?.days && (
              <span className="text-zinc-400 ml-1">({fastestShip.days}d)</span>
            )}
          </div>
        )}

        {/* Supplier Reliability Score */}
        {(() => {
          let score = 50;
          if (product.rating >= 4.5) score += 25;
          else if (product.rating >= 4.0) score += 15;
          else if (product.rating > 0) score += 5;
          if (product.totalOrders > 1000) score += 20;
          else if (product.totalOrders > 100) score += 10;
          if (freeShipping) score += 5;
          score = Math.min(100, score);

          const color = score >= 80
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : score >= 60
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
          const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Fair";

          return (
            <div className="flex items-center gap-1.5">
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                {label} Supplier
              </div>
              <span className="text-[10px] text-zinc-400">{score}/100</span>
            </div>
          );
        })()}

        {/* Buttons */}
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); onImport(product.externalId); }}
          >
            Import
          </Button>
          {product.sourceUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); window.open(product.sourceUrl, "_blank"); }}
            >
              Source
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("trending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SourcedProduct | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("page", String(page));
      if (category !== "all") params.set("category", category);

      const endpoint = !query && category === "all"
        ? `/api/sourcing/trending?${params}`
        : `/api/sourcing/search?${params}`;

      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [query, category, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  function handleImport(productId: string) {
    router.push(`/products/import?productId=${productId}`);
  }

  function clearAllFilters() {
    setQuery("");
    setSearchInput("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setPage(1);
  }

  const hasActiveFilters = minPrice !== "" || maxPrice !== "" || minRating > 0;

  // Apply client-side filters (price range and rating) on top of server results
  const allProducts = data ? sortProducts(data.products, sort) : [];
  const products = allProducts.filter((p) => {
    const price = Number(p.price);
    if (minPrice !== "" && price < Number(minPrice)) return false;
    if (maxPrice !== "" && price > Number(maxPrice)) return false;
    if (minRating > 0 && Number(p.rating) < minRating) return false;
    return true;
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  // Compute display range
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = data && products.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(page * pageSize, data.total) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Discover Products
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Browse trending products from suppliers. Import with one click to start selling.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products... (e.g. wireless earbuds, yoga mat, phone case)"
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters || hasActiveFilters ? "border-zinc-900 dark:border-white" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-6">
              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Price Range (Supplier Cost)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                      className="w-24 pl-6"
                    />
                  </div>
                  <span className="text-zinc-400">-</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                      className="w-24 pl-6"
                    />
                  </div>
                </div>
              </div>

              {/* Min Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Minimum Rating
                </label>
                <StarRatingFilter value={minRating} onChange={(v) => { setMinRating(v); setPage(1); }} />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setMinRating(0); }}
                  className="text-zinc-500"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category pills — horizontally scrollable on mobile */}
      <div
        ref={categoryScrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              category === cat.id
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + count bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {data ? (
            products.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {hasActiveFilters ? products.length : `${rangeStart}-${rangeEnd}`}
                </span>{" "}
                of{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {data.total.toLocaleString()}
                </span>{" "}
                products
                {hasActiveFilters && (
                  <span className="text-zinc-400"> (filtered)</span>
                )}
              </>
            ) : (
              <span>No products match your filters</span>
            )
          ) : (
            "Loading..."
          )}
        </p>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-zinc-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 px-2 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4 mb-4">
              <Package className="h-10 w-10 text-zinc-400" />
            </div>
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              No products found
            </p>
            <p className="text-sm text-zinc-500 mt-1 text-center max-w-sm">
              {hasActiveFilters
                ? "No products match your current filters. Try adjusting the price range or minimum rating."
                : "Try a different search term or browse another category."}
            </p>
            <div className="flex gap-2 mt-4">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setMinRating(0); }}
                >
                  Clear price/rating filters
                </Button>
              )}
              <Button
                variant="outline"
                onClick={clearAllFilters}
              >
                Reset all filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.externalId}
              product={product}
              onImport={handleImport}
              onSelect={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>

          {/* Page number buttons */}
          {(() => {
            const pages: (number | "...")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (page > 3) pages.push("...");
              for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
              }
              if (page < totalPages - 2) pages.push("...");
              pages.push(totalPages);
            }
            return pages.map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-2 text-zinc-400 text-sm">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="min-w-[36px]"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            );
          })()}

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">Product Details</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-zinc-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images */}
              <div className="grid grid-cols-4 gap-2">
                {(selectedProduct.images || []).slice(0, 4).map((img, i) => (
                  <ProductImage
                    key={i}
                    src={img}
                    alt={selectedProduct.title}
                    className="rounded-lg aspect-square object-cover w-full"
                  />
                ))}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold">{selectedProduct.title}</h3>

              {/* Price & Profit */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-500">Supplier Cost</div>
                  <div className="text-lg font-bold">${Number(selectedProduct.price).toFixed(2)}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-3">
                  <div className="text-xs text-emerald-600">Sell For (2.5x)</div>
                  <div className="text-lg font-bold text-emerald-600">${(Number(selectedProduct.price) * MARKUP).toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <div className="text-xs text-blue-600">Profit Per Sale</div>
                  <div className="text-lg font-bold text-blue-600">${(Number(selectedProduct.price) * MARKUP - Number(selectedProduct.price)).toFixed(2)}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{Number(selectedProduct.rating).toFixed(1)}</span>
                </div>
                <span>{Number(selectedProduct.totalOrders).toLocaleString()} orders</span>
                {selectedProduct.variants?.length > 0 && <span>{selectedProduct.variants.length} variants</span>}
              </div>

              {/* Variants */}
              {selectedProduct.variants?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm">
                        {v.name} — ${Number(v.price).toFixed(2)}
                        {v.stock > 0 && <span className="text-zinc-400 ml-1">({v.stock} in stock)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping */}
              {selectedProduct.shippingOptions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Shipping Options</h4>
                  <div className="space-y-1">
                    {selectedProduct.shippingOptions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                        <span>{s.carrier}</span>
                        <span>{s.cost === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `$${Number(s.cost).toFixed(2)}`} &middot; {s.days} days</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-zinc-500 line-clamp-6">{selectedProduct.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => { setSelectedProduct(null); handleImport(selectedProduct.externalId); }}>
                  Import to My Store
                </Button>
                {selectedProduct.sourceUrl && (
                  <Button variant="outline" onClick={() => window.open(selectedProduct.sourceUrl, "_blank")}>
                    View on AliExpress
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

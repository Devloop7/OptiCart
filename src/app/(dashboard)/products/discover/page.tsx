"use client";

import { useState, useEffect, useCallback } from "react";
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

// ─── Helper ─────────────────────────────────────────────────────────────────

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

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(product)}>
      {/* Image */}
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
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

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("trending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SourcedProduct | null>(null);

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

  const products = data ? sortProducts(data.products, sort) : [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

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
      </form>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
            <>
              Showing{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {products.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {data.total}
              </span>{" "}
              products
            </>
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Package className="h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              No products found
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Try a different search term or browse another category.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setSearchInput("");
                setCategory("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
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
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-zinc-500 px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="rounded-lg aspect-square object-cover w-full" />
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

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, DollarSign, Package, ChevronDown, ExternalLink, Star, Zap, X } from "lucide-react";

interface WinningProduct {
  id: string;
  title: string;
  image: string;
  supplierPrice: number;
  suggestedPrice: number;
  margin: number;
  score: number;
  category: string;
  supplier: string;
  trending: boolean;
  demandLevel: "low" | "medium" | "high" | "very_high";
  competition: "low" | "medium" | "high";
  shippingDays: number;
  insights: string[];
  sourceUrl: string;
}

const demandColors = {
  low: "secondary",
  medium: "default",
  high: "warning",
  very_high: "success",
} as const;

const competitionColors = {
  low: "success",
  medium: "warning",
  high: "destructive",
} as const;

export default function WinningProductsPage() {
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);
  const [filters, setFilters] = useState({
    category: "all",
    minScore: 0,
    trending: false,
    sort: "score",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
    if (filters.trending) params.set("trending", "true");
    params.set("sort", filters.sort);

    setLoading(true);
    fetch(`/api/ai/winning-products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setProducts(json.data.products);
          setCategories(json.data.categories);
        }
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const ScoreRing = ({ score }: { score: number }) => {
    const color = score >= 90 ? "text-emerald-500" : score >= 80 ? "text-yellow-500" : "text-zinc-400";
    return (
      <div className={`flex items-center gap-1 font-bold text-lg ${color}`}>
        <Star className="h-4 w-4 fill-current" />
        {score}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Winning Products</h1>
            <p className="text-sm text-zinc-500">AI-curated products with high profit potential</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Zap className="h-4 w-4 mr-1" /> Refresh Analysis
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="score">Sort by Score</option>
          <option value="margin">Sort by Margin</option>
          <option value="price">Sort by Price</option>
        </select>

        <select
          value={String(filters.minScore)}
          onChange={(e) => setFilters((f) => ({ ...f, minScore: Number(e.target.value) }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="0">Min Score: Any</option>
          <option value="80">80+</option>
          <option value="85">85+</option>
          <option value="90">90+</option>
        </select>

        <button
          onClick={() => setFilters((f) => ({ ...f, trending: !f.trending }))}
          className={`flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors ${
            filters.trending
              ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Trending Only
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="text-zinc-500">No products match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-4">
                {/* Image placeholder */}
                <div className="relative mb-3 h-36 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                  <Package className="h-12 w-12 text-zinc-400" />
                  {product.trending && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-[10px]">
                      <TrendingUp className="h-3 w-3 mr-1" /> TRENDING
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2">
                    <ScoreRing score={product.score} />
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.title}</h3>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{product.supplier}</Badge>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-zinc-500 text-xs">Cost</div>
                    <div className="font-medium">${product.supplierPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Sell</div>
                    <div className="font-medium">${product.suggestedPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Margin</div>
                    <div className="font-bold text-emerald-600">{product.margin}%</div>
                  </div>
                </div>

                {/* Demand / Competition */}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={demandColors[product.demandLevel]} className="text-[10px]">
                    Demand: {product.demandLevel.replace("_", " ")}
                  </Badge>
                  <Badge variant={competitionColors[product.competition]} className="text-[10px]">
                    Comp: {product.competition}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProduct(null)}>
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedProduct.title}</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Star className={`h-6 w-6 fill-current ${selectedProduct.score >= 90 ? "text-emerald-500" : "text-yellow-500"}`} />
                <span className="text-2xl font-bold">{selectedProduct.score}/100</span>
              </div>
              <Badge variant={demandColors[selectedProduct.demandLevel]}>
                {selectedProduct.demandLevel.replace("_", " ")} demand
              </Badge>
              {selectedProduct.trending && (
                <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" /> Trending</Badge>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">Supplier Cost</div>
                <div className="text-lg font-bold">${selectedProduct.supplierPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">Suggested Price</div>
                <div className="text-lg font-bold">${selectedProduct.suggestedPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950">
                <div className="text-xs text-emerald-600">Profit / Unit</div>
                <div className="text-lg font-bold text-emerald-600">
                  ${(selectedProduct.suggestedPrice - selectedProduct.supplierPrice).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-sm">
                <span className="text-zinc-500">Supplier:</span>{" "}
                <span className="font-medium">{selectedProduct.supplier}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Shipping:</span>{" "}
                <span className="font-medium">{selectedProduct.shippingDays} days</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Competition:</span>{" "}
                <Badge variant={competitionColors[selectedProduct.competition]} className="ml-1 text-[10px]">
                  {selectedProduct.competition}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Margin:</span>{" "}
                <span className="font-bold text-emerald-600">{selectedProduct.margin}%</span>
              </div>
            </div>

            {/* AI Insights */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-500" /> AI Insights
              </h3>
              <ul className="space-y-2">
                {selectedProduct.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Package className="h-4 w-4 mr-1" /> Import to Store
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-1" /> View Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

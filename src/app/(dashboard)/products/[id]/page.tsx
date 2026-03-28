"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, ExternalLink, Package, DollarSign, Upload, Loader2, Store, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Variant {
  id: string;
  name: string;
  sku: string;
  supplierCost: number;
  retailPrice: number;
  stock: number;
  isActive: boolean;
}

interface StoreLink {
  id: string;
  isPushed: boolean;
  externalProductId: string | null;
  store: { id: string; name: string; platform?: string };
}

interface SupplierInfo {
  sourceUrl: string | null;
  rating: number | null;
  totalOrders: number | null;
  title: string;
}

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  images: unknown; // Json field from Prisma
  tags: string[];
  category: string | null;
  status: string;
  variants: Variant[];
  storeLinks: StoreLink[];
  supplierProduct: SupplierInfo | null;
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
      if (images.startsWith("http")) return [images];
    }
  }
  return [];
}

/** Convert Prisma Decimal fields to plain numbers */
function serializeProduct(data: Record<string, unknown>): ProductDetail {
  const d = data as unknown as ProductDetail;
  return {
    ...d,
    variants: (d.variants ?? []).map((v) => ({
      ...v,
      supplierCost: Number(v.supplierCost) || 0,
      retailPrice: Number(v.retailPrice) || 0,
      stock: Number(v.stock) || 0,
    })),
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [shippingEstimate, setShippingEstimate] = useState(2.5);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pushing, setPushing] = useState(false);
  const [stores, setStores] = useState<Array<{ id: string; name: string; platform: string; isActive: boolean }>>([]);

  // Load stores for push-to-store
  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setStores((json.data ?? []).filter((s: { isActive: boolean }) => s.isActive));
      })
      .catch(() => {});
  }, []);

  async function handlePushToStore(storeId: string) {
    setPushing(true);
    try {
      const res = await fetch("/api/shopify/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, storeId }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaveMessage({ type: "success", text: "Product pushed to store!" });
      } else {
        setSaveMessage({ type: "error", text: json.error ?? "Failed to push product." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setPushing(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.data) {
          const p = serializeProduct(json.data as Record<string, unknown>);
          setProduct(p);
          setTitle(p.title);
          setDescription(p.description ?? "");
          setTagsStr((p.tags ?? []).join(", "));
          setCategory(p.category ?? "");
          setStatus(p.status);
          setVariants(p.variants ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
          category,
          status,
          variants: variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            supplierCost: v.supplierCost,
            retailPrice: v.retailPrice,
            stock: v.stock,
            isActive: v.isActive,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaveMessage({ type: "success", text: "Product saved successfully." });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: json.error ?? "Failed to save product." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  function updateVariant(id: string, field: keyof Variant, value: unknown) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Package className="h-12 w-12 mb-3" />
        <p>Product not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  const supplier = product.supplierProduct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold truncate">{title || "Product"}</h1>
          <Badge variant={status === "ACTIVE" ? "success" : status === "PAUSED" ? "warning" : "secondary"}>
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {stores.length > 0 && (
            <div className="relative group">
              <Button
                variant="outline"
                disabled={pushing}
                className="gap-1.5"
              >
                {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Push to Store
              </Button>
              <div className="invisible group-hover:visible absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handlePushToStore(store.id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Store className="h-3.5 w-3.5 text-zinc-400" />
                    {store.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {stores.length === 0 && (
            <Button variant="outline" onClick={() => router.push("/stores")} className="gap-1.5">
              <Store className="h-4 w-4" />
              Connect Store
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          saveMessage.type === "success"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
            : "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags (comma separated)</label>
                  <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variants</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {variants.length === 0 ? (
                <p className="p-6 text-sm text-zinc-400">No variants</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Supplier Cost</TableHead>
                      <TableHead>Retail Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-zinc-500 text-sm">{v.sku}</TableCell>
                        <TableCell className="text-sm">${v.supplierCost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={v.retailPrice}
                            onChange={(e) => updateVariant(v.id, "retailPrice", parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-sm">{v.stock.toLocaleString()}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => updateVariant(v.id, "isActive", !v.isActive)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              v.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              v.isActive ? "translate-x-4" : "translate-x-0.5"
                            }`} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Profit Calculator */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-base">Profit Calculator</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Shipping Estimate ($)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={shippingEstimate}
                  onChange={(e) => setShippingEstimate(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-32"
                />
              </div>
              <div className="space-y-2">
                {variants.map((v) => {
                  const totalCost = v.supplierCost + shippingEstimate;
                  const profit = v.retailPrice - totalCost;
                  const margin = v.retailPrice > 0 ? (profit / v.retailPrice) * 100 : 0;
                  return (
                    <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700 gap-1">
                      <span className="text-sm font-medium">{v.name}</span>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                        <span className="text-zinc-500">
                          ${v.supplierCost.toFixed(2)} + ${shippingEstimate.toFixed(2)} = ${totalCost.toFixed(2)}
                        </span>
                        <span>Retail: ${v.retailPrice.toFixed(2)}</span>
                        <span className={profit >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-500"}>
                          ${profit.toFixed(2)} ({margin.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Images */}
          {parseImages(product.images).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {parseImages(product.images).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <img src={img} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Store Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Store Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(product.storeLinks ?? []).length === 0 ? (
                <p className="text-sm text-zinc-400">Not linked to any store</p>
              ) : (
                product.storeLinks.map((sl) => (
                  <div key={sl.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium">{sl.store.name}</p>
                      {sl.store.platform && <p className="text-xs text-zinc-500">{sl.store.platform}</p>}
                    </div>
                    <Badge variant={sl.isPushed ? "success" : "warning"}>
                      {sl.isPushed ? "Pushed" : "Pending"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Supplier Info */}
          {supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supplier Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{supplier.title}</p>
                {supplier.rating && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Rating:</span>
                    <span className="font-medium">{supplier.rating}/5</span>
                  </div>
                )}
                {supplier.totalOrders && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Orders:</span>
                    <span className="font-medium">{supplier.totalOrders.toLocaleString()}</span>
                  </div>
                )}
                {supplier.sourceUrl && (
                  <a
                    href={supplier.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on AliExpress
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

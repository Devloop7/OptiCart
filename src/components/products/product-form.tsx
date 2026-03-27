"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/components/products/product-table";

interface ProductFormProps {
  product?: Product | null;
  stores: Array<{ id: string; name: string }>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export interface ProductFormData {
  title: string;
  description: string;
  storeId: string;
  supplierPrice: number;
  sellingPrice: number;
  supplierStock: number;
  tags: string[];
  autoSync: boolean;
}

export function ProductForm({ product, stores, onSubmit, onCancel }: ProductFormProps) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [storeId, setStoreId] = useState(product?.storeId ?? "");
  const [supplierPrice, setSupplierPrice] = useState(product ? String(product.supplierPrice) : "");
  const [sellingPrice, setSellingPrice] = useState(product ? String(product.sellingPrice) : "");
  const [supplierStock, setSupplierStock] = useState(product ? String(product.supplierStock) : "0");
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");
  const [autoSync, setAutoSync] = useState(product?.autoSync ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      description,
      storeId,
      supplierPrice: parseFloat(supplierPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      supplierStock: parseInt(supplierStock, 10) || 0,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      autoSync,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="pf-title" className="text-sm font-medium">
          Title
        </label>
        <Input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="pf-desc" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="pf-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-400"
        />
      </div>

      {/* Store */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Store</label>
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pf-cost" className="text-sm font-medium">
            Supplier Price
          </label>
          <Input
            id="pf-cost"
            type="number"
            step="0.01"
            min="0"
            value={supplierPrice}
            onChange={(e) => setSupplierPrice(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pf-sell" className="text-sm font-medium">
            Selling Price
          </label>
          <Input
            id="pf-sell"
            type="number"
            step="0.01"
            min="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-1.5">
        <label htmlFor="pf-stock" className="text-sm font-medium">
          Supplier Stock
        </label>
        <Input
          id="pf-stock"
          type="number"
          min="0"
          value={supplierStock}
          onChange={(e) => setSupplierStock(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label htmlFor="pf-tags" className="text-sm font-medium">
          Tags (comma separated)
        </label>
        <Input id="pf-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. electronics, phone case" />
      </div>

      {/* Auto Sync Toggle */}
      <div className="flex items-center gap-2">
        <input
          id="pf-sync"
          type="checkbox"
          checked={autoSync}
          onChange={(e) => setAutoSync(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <label htmlFor="pf-sync" className="text-sm font-medium">
          Auto-sync with supplier
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{product ? "Update Product" : "Add Product"}</Button>
      </div>
    </form>
  );
}

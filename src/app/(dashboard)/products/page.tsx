"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductTable, type Product } from "@/components/products/product-table";
import { ProductFiltersBar, type ProductFilters } from "@/components/products/product-filters";
import { ProductForm, type ProductFormData } from "@/components/products/product-form";

interface Store {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    status: "ALL",
    storeId: "ALL",
    sortBy: "updatedAt",
  });

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters.storeId && filters.storeId !== "ALL") params.set("storeId", filters.storeId);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setProducts(json.data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch("/api/stores");
        const json = await res.json();
        if (json.ok) {
          setStores(json.data ?? []);
        }
      } catch {
        // Silently fail
      }
    }
    loadStores();
  }, []);

  // -- Handlers --

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleAddNew() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function handleDelete(product: Product) {
    setDeleteTarget(product);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      }
    } catch {
      // Silently fail
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleFormSubmit(data: ProductFormData) {
    try {
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          setFormOpen(false);
          setEditingProduct(null);
          fetchProducts();
        }
      } else {
        // Create
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.ok) {
          setFormOpen(false);
          fetchProducts();
        }
      }
    } catch {
      // Silently fail
    }
  }

  async function handleBulkAction(action: string, ids: string[]) {
    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} product(s)?`)) return;
    }
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const json = await res.json();
      if (json.ok) {
        setSelectedIds([]);
        fetchProducts();
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <ProductFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        stores={stores}
        suppliers={[]}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-400 animate-pulse">Loading products...</div>
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkAction={handleBulkAction}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            stores={stores}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

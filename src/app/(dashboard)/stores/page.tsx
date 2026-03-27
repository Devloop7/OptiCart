"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StoreCard, type StoreData } from "@/components/stores/store-card";
import { StoreForm, type StoreFormValues } from "@/components/stores/store-form";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [deletingStore, setDeletingStore] = useState<StoreData | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      const json = await res.json();
      if (json.ok) {
        setStores(json.data.stores);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  async function handleCreate(values: StoreFormValues) {
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setFormOpen(false);
      fetchStores();
    }
  }

  async function handleEdit(values: StoreFormValues) {
    if (!editingStore) return;
    const res = await fetch(`/api/stores/${editingStore.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setEditingStore(null);
      fetchStores();
    }
  }

  async function handleDelete() {
    if (!deletingStore) return;
    const res = await fetch(`/api/stores/${deletingStore.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeletingStore(null);
      fetchStores();
    }
  }

  async function handleToggle(store: StoreData) {
    await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !store.isActive }),
    });
    fetchStores();
  }

  const activeCount = stores.filter((s) => s.isActive).length;
  const totalProducts = stores.reduce((sum, s) => sum + s.productCount, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stores</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your connected store integrations
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>Connect Store</Button>
      </div>

      {/* Summary cards */}
      {!loading && stores.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Total Stores
              </p>
              <p className="text-2xl font-bold">{stores.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Active Stores
              </p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Total Products
              </p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-56 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No stores connected</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Add your first store to get started.
            </p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              Connect Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={(s) => setEditingStore(s)}
              onDelete={(s) => setDeletingStore(s)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Create store dialog */}
      <StoreForm
        open={formOpen}
        onSubmit={handleCreate}
        onCancel={() => setFormOpen(false)}
      />

      {/* Edit store dialog */}
      {editingStore && (
        <StoreForm
          key={editingStore.id}
          store={editingStore}
          open={!!editingStore}
          onSubmit={handleEdit}
          onCancel={() => setEditingStore(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDeletingStore(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-lg font-semibold">Delete Store</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {deletingStore.name}
              </span>
              ? This will also remove all associated products and orders. This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingStore(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

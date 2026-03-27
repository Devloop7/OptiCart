"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  storeId: string;
  supplierId: string | null;
  supplierPrice: number;
  sellingPrice: number;
  supplierStock: number;
  status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" | "ERROR";
  autoSync: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string };
  supplier?: { id: string; name: string; platform: string } | null;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onBulkAction: (action: string, ids: string[]) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

const statusVariant: Record<Product["status"], "success" | "secondary" | "destructive" | "warning" | "default"> = {
  ACTIVE: "success",
  DRAFT: "secondary",
  OUT_OF_STOCK: "destructive",
  DISCONTINUED: "warning",
  ERROR: "destructive",
};

const statusLabel: Record<Product["status"], string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  OUT_OF_STOCK: "Out of Stock",
  DISCONTINUED: "Discontinued",
  ERROR: "Error",
};

function calcMargin(cost: number, sell: number): string {
  if (sell === 0) return "0.0";
  return (((sell - cost) / sell) * 100).toFixed(1);
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onBulkAction,
  selectedIds,
  setSelectedIds,
}: ProductTableProps) {
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  }

  function toggleOne(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-2">
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {selectedIds.length} selected
          </span>
          <Button size="sm" variant="outline" onClick={() => onBulkAction("activate", selectedIds)}>
            Activate
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBulkAction("deactivate", selectedIds)}>
            Deactivate
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onBulkAction("delete", selectedIds)}>
            Delete
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-zinc-300"
              />
            </TableHead>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Sell Price</TableHead>
            <TableHead className="text-right">Margin%</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center text-zinc-500">
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id} data-state={selectedIds.includes(product.id) ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleOne(product.id)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </TableCell>
                <TableCell>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{product.title}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">
                  {product.store?.name ?? "—"}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">
                  {product.supplier?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right">${Number(product.supplierPrice).toFixed(2)}</TableCell>
                <TableCell className="text-right">${Number(product.sellingPrice).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {calcMargin(Number(product.supplierPrice), Number(product.sellingPrice))}%
                </TableCell>
                <TableCell className="text-right">{product.supplierStock}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[product.status]}>{statusLabel[product.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(product)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(product)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoreData } from "./store-card";

export interface StoreFormValues {
  name: string;
  storeType: "SHOPIFY" | "WOOCOMMERCE" | "EBAY" | "TIKTOK_SHOP";
  domain: string;
  apiEndpoint: string;
}

interface StoreFormProps {
  store?: StoreData | null;
  open: boolean;
  onSubmit: (values: StoreFormValues) => void;
  onCancel: () => void;
}

const storeTypeOptions = [
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WOOCOMMERCE", label: "WooCommerce" },
  { value: "EBAY", label: "eBay" },
  { value: "TIKTOK_SHOP", label: "TikTok Shop" },
] as const;

export function StoreForm({ store, open, onSubmit, onCancel }: StoreFormProps) {
  const isEditing = !!store;

  const [name, setName] = useState(store?.name ?? "");
  const [storeType, setStoreType] = useState<StoreFormValues["storeType"]>(
    store?.storeType ?? "SHOPIFY"
  );
  const [domain, setDomain] = useState(store?.domain ?? "");
  const [apiEndpoint, setApiEndpoint] = useState(store?.apiEndpoint ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Store name is required";
    }
    if (domain && !isValidUrl(domain)) {
      newErrors.domain = "Must be a valid URL";
    }
    if (apiEndpoint && !isValidUrl(apiEndpoint)) {
      newErrors.apiEndpoint = "Must be a valid URL";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ name: name.trim(), storeType, domain, apiEndpoint });
  }

  function isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Store" : "Connect New Store"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="store-name" className="text-sm font-medium">
              Store Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="store-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="My Store"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="store-type" className="text-sm font-medium">
              Platform
            </label>
            <Select
              value={storeType}
              onValueChange={(v: string) =>
                setStoreType(v as StoreFormValues["storeType"])
              }
            >
              <SelectTrigger id="store-type">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {storeTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="store-domain" className="text-sm font-medium">
              Domain
            </label>
            <Input
              id="store-domain"
              value={domain}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDomain(e.target.value);
                if (errors.domain) setErrors((prev) => ({ ...prev, domain: "" }));
              }}
              placeholder="https://mystore.com"
            />
            {errors.domain && (
              <p className="text-sm text-red-500">{errors.domain}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="store-api" className="text-sm font-medium">
              API Endpoint
            </label>
            <Input
              id="store-api"
              value={apiEndpoint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setApiEndpoint(e.target.value);
                if (errors.apiEndpoint)
                  setErrors((prev) => ({ ...prev, apiEndpoint: "" }));
              }}
              placeholder="https://api.mystore.com"
            />
            {errors.apiEndpoint && (
              <p className="text-sm text-red-500">{errors.apiEndpoint}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Connect Store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface StoreData {
  id: string;
  name: string;
  storeType: "SHOPIFY" | "WOOCOMMERCE" | "EBAY" | "TIKTOK_SHOP";
  domain: string | null;
  apiEndpoint: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  settings: unknown;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StoreCardProps {
  store: StoreData;
  onEdit: (store: StoreData) => void;
  onDelete: (store: StoreData) => void;
  onToggle: (store: StoreData) => void;
}

const platformConfig: Record<
  StoreData["storeType"],
  { label: string; icon: React.ReactNode; color: string; badgeClass: string }
> = {
  SHOPIFY: {
    label: "Shopify",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M15.34 3.03c-.04 0-.08.03-.12.03-.04.02-1.04.32-1.04.32s-.68-.68-.76-.76c-.08-.08-.24-.06-.3-.04 0 0-.16.04-.4.12a4.4 4.4 0 0 0-.3-.72C12.02 1.3 11.46 1 10.98 1c-.06 0-.12 0-.18.02-.02-.04-.06-.06-.08-.1C10.42.58 10.04.4 9.58.42c-.88.02-1.76.66-2.46 1.82-.5.82-.88 1.84-1 2.64-.98.3-1.66.52-1.68.52-.5.16-.52.18-.58.64C3.82 6.4 2 20.56 2 20.56l10.1 1.74 5.44-1.18S15.38 3.1 15.34 3.03zM11.5 4.3l-1.6.5c.16-.6.44-1.2.7-1.58.1-.16.26-.34.42-.46.18.36.28.86.48 1.54zm-1.7-2.5c.14 0 .26.02.36.08-.16.08-.3.2-.46.36-.38.42-.68 1.08-.86 1.7l-1.3.4c.26-.98.86-2.5 2.06-2.54h.2zm.46 11.38s-.54-.28-1.2-.28c-.98 0-1.02.62-1.02.76 0 .84 2.18 1.16 2.18 3.12 0 1.54-.98 2.54-2.3 2.54-1.58 0-2.38-1-2.38-1l.42-1.4s.84.72 1.54.72c.46 0 .64-.36.64-.62 0-1.1-1.78-1.14-1.78-2.94 0-1.52 1.08-2.98 3.28-2.98.84 0 1.26.24 1.26.24l-.64 1.84zm1.02-8.56c.02-.26.02-.56 0-.86.26.1.46.36.58.66-.2.06-.38.12-.58.2z" />
      </svg>
    ),
    color: "text-green-600",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M2.227 4.857A3.228 3.228 0 0 0 0 7.857v7.286a3.228 3.228 0 0 0 3.228 3.228h1.262l.594 2.572 3.2-2.572h9.488a3.228 3.228 0 0 0 3.228-3.228V7.857a3.228 3.228 0 0 0-3.228-3h-14.544zm2.153 2.2c.347-.02.67.114.97.403.3.288.505.73.616 1.323l.948 4.878-2.786-5.09c-.27-.494-.414-.904-.414-1.152a.479.479 0 0 1 .143-.27.506.506 0 0 1 .323-.09h.2zm5.08 0c.347-.02.67.114.97.403.3.288.505.73.616 1.323l.948 4.878-2.786-5.09c-.27-.494-.414-.904-.414-1.152a.479.479 0 0 1 .143-.27.506.506 0 0 1 .323-.09h.2zm5.278.2c.2-.02.385.05.554.2.17.15.3.39.393.72l.806 2.893-.893-.136-.454-1.67c-.113-.405-.236-.667-.368-.786-.13-.12-.28-.14-.443-.064-.165.077-.312.26-.44.554l-1.73 3.64.247-3.276c.04-.52.15-.895.33-1.123.182-.227.407-.35.676-.373l.086-.004c.082-.003.16.002.236.015v.41zm-5.88 5.39c.546 1 1.17 1.637 1.87 1.912l-1.87-1.912z" />
      </svg>
    ),
    color: "text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  EBAY: {
    label: "eBay",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M5.888 7.524C3.636 7.524 2 8.772 2 10.788c0 1.632.876 2.736 2.412 3.06v.036c-.612.252-1.044.756-1.044 1.368 0 .48.264.936.72 1.2v.036c-.792.372-1.284.996-1.284 1.752 0 1.32 1.308 2.16 3.36 2.16 2.52 0 3.864-1.08 3.864-2.724 0-1.344-.9-2.016-2.7-2.016H5.52c-.588 0-.888-.228-.888-.612 0-.3.204-.54.564-.696.276.072.564.108.864.108 2.232 0 3.768-1.164 3.768-3.12 0-.756-.3-1.452-.828-1.956h1.56V7.884H7.932a4.5 4.5 0 0 0-2.044-.36zM12 7.524v7.284h1.8v-2.64c0-1.884.744-2.82 2.016-2.82.936 0 1.392.552 1.392 1.644v3.816h1.8V10.44c0-1.836-.96-2.916-2.64-2.916-1.08 0-1.896.516-2.424 1.284h-.036l-.108-1.284H12zm-6.048 1.5c1.2 0 1.932.78 1.932 1.8 0 1.056-.744 1.836-1.932 1.836-1.2 0-1.932-.78-1.932-1.836 0-1.02.732-1.8 1.932-1.8zm.66 7.356c1.068 0 1.596.324 1.596.912 0 .684-.684 1.08-1.884 1.08-1.08 0-1.716-.384-1.716-1.008 0-.456.336-.804.888-.984h1.116z" />
      </svg>
    ),
    color: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  TIKTOK_SHOP: {
    label: "TikTok Shop",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.12V9.01a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.97a8.2 8.2 0 0 0 4.78 1.52V7.04a4.83 4.83 0 0 1-.88-.35z" />
      </svg>
    ),
    color: "text-zinc-900 dark:text-zinc-100",
    badgeClass: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
  },
};

function formatLastSync(dateStr: string | null): string {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function StoreCard({ store, onEdit, onDelete, onToggle }: StoreCardProps) {
  const platform = platformConfig[store.storeType];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex-shrink-0", platform.color)}>
            {platform.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{store.name}</h3>
            {store.domain && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {store.domain}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant={store.isActive ? "success" : "secondary"}
          className="flex-shrink-0"
        >
          {store.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", platform.badgeClass)}>
          {platform.label}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Products</p>
            <p className="font-semibold">{store.productCount}</p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Last Sync</p>
            <p className="font-semibold">{formatLastSync(store.lastSyncAt)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={store.isActive}
            onChange={() => onToggle(store)}
            className="peer sr-only"
          />
          <div className="peer h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full dark:bg-zinc-700" />
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
            {store.isActive ? "On" : "Off"}
          </span>
        </label>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(store)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => onDelete(store)}>
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

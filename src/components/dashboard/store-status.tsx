import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";

interface StoreHealth {
  storeId: string;
  storeName: string;
  storeType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  productCount: number;
}

const STORE_TYPE_LABELS: Record<string, string> = {
  SHOPIFY: "Shopify",
  WOOCOMMERCE: "WooCommerce",
  EBAY: "eBay",
  TIKTOK_SHOP: "TikTok Shop",
};

export function StoreStatus({ stores }: { stores: StoreHealth[] }) {
  if (stores.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Store Connections</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-4 text-zinc-400">
            <Store className="h-8 w-8" />
            <p className="text-sm">No stores connected yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Store Connections</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.storeId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${store.isActive ? "bg-green-500" : "bg-zinc-400"}`} />
                <div>
                  <p className="text-sm font-medium">{store.storeName}</p>
                  <p className="text-xs text-zinc-400">{STORE_TYPE_LABELS[store.storeType] || store.storeType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{store.productCount} products</span>
                <Badge variant={store.isActive ? "success" : "secondary"}>
                  {store.isActive ? "Active" : "Offline"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

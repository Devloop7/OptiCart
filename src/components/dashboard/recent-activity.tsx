"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft, AlertTriangle, CheckCircle, XCircle, Info,
  TrendingDown, ShoppingCart, RefreshCw
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  severity: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  ORDER_TRANSITION: ArrowRightLeft,
  PRICE_CHANGE: TrendingDown,
  API_ERROR: XCircle,
  KILL_SWITCH_ACTIVATED: AlertTriangle,
  KILL_SWITCH_DEACTIVATED: CheckCircle,
  STORE_SYNC: RefreshCw,
  AUTO_ORDER: ShoppingCart,
};

const SEVERITY_VARIANT = {
  info: "secondary",
  warning: "warning",
  error: "destructive",
  critical: "destructive",
} as const;

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((item) => {
            const Icon = ACTION_ICONS[item.action] || Info;
            const variant = SEVERITY_VARIANT[item.severity as keyof typeof SEVERITY_VARIANT] || "secondary";
            let detail = "";
            try {
              const parsed = JSON.parse(item.details);
              detail = parsed.reason || parsed.from
                ? `${parsed.from} → ${parsed.to}`
                : item.details;
            } catch {
              detail = item.details;
            }

            return (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800">
                  <Icon className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatAction(item.action)}</span>
                    <Badge variant={variant} className="text-[10px]">{item.severity}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{detail}</p>
                </div>
                <span className="text-xs text-zinc-400 whitespace-nowrap">{timeAgo(item.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Bell, Package, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "order" | "product" | "alert" | "success" | "trend";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "New Order Received",
    message: "Order #1042 from Sarah M. - $47.99",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "trend",
    title: "Trending Product Alert",
    message: "Wireless Earbuds Pro is trending in Electronics",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    type: "alert",
    title: "Low Stock Warning",
    message: "LED Ring Light has only 5 units left",
    time: "1h ago",
    read: false,
  },
  {
    id: "4",
    type: "success",
    title: "Price Sync Complete",
    message: "Updated prices for 12 products",
    time: "2h ago",
    read: true,
  },
  {
    id: "5",
    type: "product",
    title: "Product Imported",
    message: "Portable Blender added to your catalog",
    time: "3h ago",
    read: true,
  },
];

const ICON_MAP = {
  order: ShoppingCart,
  product: Package,
  alert: AlertTriangle,
  success: CheckCircle2,
  trend: TrendingUp,
};

const COLOR_MAP = {
  order: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  product: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  alert: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  trend: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications(notifications.filter((n) => n.id !== id));
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-6 w-6 text-zinc-300" />
                  <p className="mt-2 text-xs text-zinc-400">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = ICON_MAP[notification.type];
                  const colorClass = COLOR_MAP[notification.type];

                  return (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-3 border-b border-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50 ${
                        !notification.read ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{notification.message}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{notification.time}</p>
                      </div>
                      <button
                        onClick={() => dismiss(notification.id)}
                        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-zinc-400 hover:text-zinc-600" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <button
                onClick={() => setOpen(false)}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

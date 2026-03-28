"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard, Package, ShoppingCart, Zap,
  Sparkles, Settings, ChevronLeft, ChevronRight, CreditCard, LogOut, Globe,
  Store, Plug, BarChart3, HelpCircle, ArrowUpDown, Calculator, Upload
} from "lucide-react";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products/discover", label: "Discover", icon: Globe },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/stores", label: "Stores", icon: Store },
];

const NAV_TOOLS = [
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/ai/winning-products", label: "AI Research", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/products/compare", label: "Compare", icon: ArrowUpDown },
  { href: "/tools/profit-calculator", label: "Profit Calc", icon: Calculator },
  { href: "/products/import/csv", label: "CSV Import", icon: Upload },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

const NAV_BOTTOM = [
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/help", label: "Help Center", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

const NAV_ITEMS = [...NAV_MAIN, ...NAV_TOOLS, ...NAV_BOTTOM];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  return (
    <aside className={cn(
      "flex h-screen flex-col border-r border-zinc-200 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-950",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="OptiCart" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              Opti<span className="text-purple-600">Cart</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <img src="/logo-icon.png" alt="OptiCart" className="h-8 w-8 rounded-lg" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Main nav */}
        <div className="space-y-1">
          {NAV_MAIN.map((item) => {
            const isActive = item.href === "/products"
              ? pathname === "/products" || pathname === "/products/import"
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Section divider - Tools */}
        {!collapsed && (
          <div className="mt-5 mb-2 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Tools</span>
          </div>
        )}
        {collapsed && <div className="my-3 border-t border-zinc-200 dark:border-zinc-800" />}

        <div className="space-y-1">
          {NAV_TOOLS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Section divider - Settings */}
        {!collapsed && (
          <div className="mt-5 mb-2 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Account</span>
          </div>
        )}
        {collapsed && <div className="my-3 border-t border-zinc-200 dark:border-zinc-800" />}

        <div className="space-y-1">
          {NAV_BOTTOM.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        {!collapsed && session?.user && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{session.user.name || session.user.email}</p>
            <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        {!collapsed && <p className="mt-2 px-1 text-xs text-zinc-400">Opticart v0.1.0</p>}
      </div>
    </aside>
  );
}

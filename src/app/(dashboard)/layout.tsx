"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/layout/command-palette";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/orders": "Orders",
  "/stores": "Stores",
  "/automations": "Automations",
  "/ai/winning-products": "AI Research",
  "/integrations": "Integrations",
  "/billing": "Billing",
  "/settings": "Settings",
  "/onboarding": "Welcome",
  "/analytics": "Analytics",
  "/help": "Help Center",
  "/products/compare": "Compare Products",
  "/tools/profit-calculator": "Profit Calculator",
  "/products/import/csv": "CSV Import",
};

function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname?.startsWith(path))?.[1] ?? "Dashboard";
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {/* Global search — triggers command palette */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="relative hidden md:flex items-center gap-2 h-8 w-64 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-400 hover:bg-zinc-100 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] font-medium dark:border-zinc-600 dark:bg-zinc-700">
            Ctrl+K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDropdown />
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
            {initials}
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

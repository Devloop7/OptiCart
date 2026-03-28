"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Zap,
  Sparkles,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
  Globe,
  Plug,
  Calculator,
  Upload,
  ArrowUpDown,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  category: string;
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview of your business", icon: LayoutDashboard, href: "/dashboard", category: "Navigation" },
  { id: "discover", label: "Discover Products", description: "Browse and import products", icon: Globe, href: "/products/discover", category: "Navigation" },
  { id: "products", label: "My Products", description: "Manage your product catalog", icon: Package, href: "/products", category: "Navigation" },
  { id: "orders", label: "Orders", description: "View and manage orders", icon: ShoppingCart, href: "/orders", category: "Navigation" },
  { id: "stores", label: "Stores", description: "Manage connected stores", icon: Store, href: "/stores", category: "Navigation" },
  { id: "analytics", label: "Analytics", description: "View performance metrics", icon: BarChart3, href: "/analytics", category: "Navigation" },
  { id: "automations", label: "Automations", description: "Stock and price sync rules", icon: Zap, href: "/automations", category: "Tools" },
  { id: "ai-research", label: "AI Research", description: "AI-powered product analysis", icon: Sparkles, href: "/ai/winning-products", category: "Tools" },
  { id: "compare", label: "Compare Products", description: "Side-by-side comparison", icon: ArrowUpDown, href: "/products/compare", category: "Tools" },
  { id: "profit-calc", label: "Profit Calculator", description: "Calculate margins and ROI", icon: Calculator, href: "/tools/profit-calculator", category: "Tools" },
  { id: "csv-import", label: "CSV Import", description: "Bulk import from spreadsheet", icon: Upload, href: "/products/import/csv", category: "Tools" },
  { id: "integrations", label: "Integrations", description: "Connect platforms and suppliers", icon: Plug, href: "/integrations", category: "Settings" },
  { id: "billing", label: "Billing", description: "Plans and usage", icon: CreditCard, href: "/billing", category: "Settings" },
  { id: "settings", label: "Settings", description: "Account and workspace settings", icon: Settings, href: "/settings", category: "Settings" },
  { id: "help", label: "Help Center", description: "Guides, FAQ, and support", icon: HelpCircle, href: "/help", category: "Settings" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [productResults, setProductResults] = useState<CommandItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Search products from API when query is 3+ chars
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!open || query.length < 3) {
      setProductResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sourcing/search?q=${encodeURIComponent(query)}&limit=5`);
        const json = await res.json();
        if (json.ok && json.data?.products) {
          setProductResults(
            json.data.products.slice(0, 5).map((p: { externalId: string; title: string; price: number }) => ({
              id: `product-${p.externalId}`,
              label: p.title,
              description: `$${Number(p.price).toFixed(2)} — Click to import`,
              icon: Package,
              href: `/products/import?productId=${p.externalId}`,
              category: "Products",
            }))
          );
        }
      } catch {}
      setSearching(false);
    }, 400);
  }, [query, open]);

  const commandResults = query
    ? COMMANDS.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          (cmd.description?.toLowerCase().includes(query.toLowerCase()))
      )
    : COMMANDS;

  const filtered = [...commandResults, ...productResults];

  // Group by category
  const grouped: Record<string, CommandItem[]> = {};
  filtered.forEach((cmd) => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });

  const flatList = filtered;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }

      if (!open) return;

      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatList[selectedIndex];
        if (item) {
          router.push(item.href);
          setOpen(false);
        }
      }
    },
    [open, flatList, selectedIndex, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15%] z-[61] mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-700">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            <kbd className="hidden shrink-0 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline dark:border-zinc-700 dark:bg-zinc-800">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {flatList.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {category}
                  </p>
                  {items.map((item) => {
                    const globalIndex = flatList.indexOf(item);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
                            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-500" : "text-zinc-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-zinc-400 truncate">{item.description}</p>
                          )}
                        </div>
                        {isSelected && <ArrowRight className="h-3 w-3 shrink-0 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">↵</kbd>
                Open
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">OptiCart</span>
          </div>
        </div>
      </div>
    </>
  );
}

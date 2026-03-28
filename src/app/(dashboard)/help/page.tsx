"use client";

import { useState } from "react";
import {
  Search,
  Book,
  Video,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Store,
  Package,
  DollarSign,
  ShoppingCart,
  Settings,
  ExternalLink,
  Mail,
  HelpCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    id: "1",
    category: "Getting Started",
    question: "How do I connect my Shopify store?",
    answer:
      "Go to Stores in the sidebar, click 'Connect Store', enter your Shopify store domain (e.g., mystore.myshopify.com), and follow the OAuth authorization flow. Once connected, you can push products directly to your store.",
  },
  {
    id: "2",
    category: "Getting Started",
    question: "How do I import my first product?",
    answer:
      "Navigate to Discover in the sidebar to browse our catalog of 500+ real AliExpress products. Click on any product to see details, then click 'Import' to add it to your catalog. You can edit the title, description, and pricing before publishing.",
  },
  {
    id: "3",
    category: "Products",
    question: "How does the pricing markup work?",
    answer:
      "OptiCart uses a multiplier-based pricing system. The default is 2.5x, meaning a product costing $10 from the supplier will be listed at $25 in your store. You can customize this per product or set global pricing rules in Settings.",
  },
  {
    id: "4",
    category: "Products",
    question: "What is the Supplier Reliability Score?",
    answer:
      "Each product shows a supplier score from 0-100 based on the supplier's rating, order volume, and shipping reliability. Scores above 80 are 'Excellent', 60-79 are 'Good', and below 60 are 'Fair'. We recommend prioritizing products from suppliers with 80+ scores.",
  },
  {
    id: "5",
    category: "Orders",
    question: "How does order fulfillment work?",
    answer:
      "When a customer places an order in your store, it appears in your Orders dashboard. You can manually place the order with the supplier, or set up automation rules to auto-fulfill orders. The system tracks the order through supplier placement, shipping, and delivery.",
  },
  {
    id: "6",
    category: "Orders",
    question: "Can I automate order processing?",
    answer:
      "Yes! Go to Automations in the sidebar to set up auto-fulfillment rules. You can configure stock sync (to keep inventory updated) and price sync (to adjust prices automatically). The system will process orders based on your rules.",
  },
  {
    id: "7",
    category: "Integrations",
    question: "Which platforms does OptiCart support?",
    answer:
      "Currently, OptiCart fully supports Shopify with OAuth integration. WooCommerce, eBay, and TikTok Shop store integrations are coming soon. For suppliers, we support AliExpress with CJ Dropshipping and Alibaba/1688 coming next.",
  },
  {
    id: "8",
    category: "Billing",
    question: "What's included in the free plan?",
    answer:
      "The free plan includes up to 25 products, 1 connected store, manual order processing, basic analytics, and community support. Upgrade to Starter ($29/mo) or Pro ($79/mo) for more products, stores, automation, and AI features.",
  },
  {
    id: "9",
    category: "AI Features",
    question: "How does AI Product Research work?",
    answer:
      "Our AI analyzes product trends, competition, demand signals, and profit potential to score products on a 0-100 scale. Products with higher scores have better chances of being profitable. Access this from the AI Research page.",
  },
  {
    id: "10",
    category: "Security",
    question: "Is my store data secure?",
    answer:
      "Yes. We use industry-standard OAuth 2.0 for store connections, encrypt all access tokens at rest, and never store your Shopify admin password. All data is transmitted over HTTPS and stored in encrypted databases.",
  },
];

const GUIDES = [
  {
    title: "Getting Started Guide",
    desc: "Set up your account, connect your store, and import your first product",
    icon: Book,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    steps: 5,
    time: "10 min",
  },
  {
    title: "Product Import Tutorial",
    desc: "Learn how to find, evaluate, and import winning products",
    icon: Package,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    steps: 4,
    time: "8 min",
  },
  {
    title: "Pricing Strategy Guide",
    desc: "Set up pricing rules, markups, and competitive pricing",
    icon: DollarSign,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    steps: 3,
    time: "5 min",
  },
  {
    title: "Order Automation Setup",
    desc: "Configure auto-fulfillment and sync rules",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    steps: 4,
    time: "7 min",
  },
  {
    title: "Shopify Integration",
    desc: "Connect your Shopify store and push products",
    icon: Store,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    steps: 3,
    time: "5 min",
  },
  {
    title: "AI Research Tools",
    desc: "Use AI to find winning products and trends",
    icon: Sparkles,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    steps: 3,
    time: "6 min",
  },
];

const CATEGORIES = ["All", "Getting Started", "Products", "Orders", "Integrations", "Billing", "AI Features", "Security"];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState("All");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchCategory = faqCategory === "All" || faq.category === faqCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Find answers, tutorials, and support for your OptiCart account
        </p>
        <div className="mx-auto mt-6 max-w-md relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Guides", icon: Book, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Video Tutorials", icon: Video, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/20" },
          { label: "FAQ", icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Contact Support", icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
        ].map((link) => (
          <button
            key={link.label}
            className={`flex flex-col items-center gap-2 rounded-xl ${link.bg} p-5 transition-all hover:shadow-sm`}
          >
            <link.icon className={`h-6 w-6 ${link.color}`} />
            <span className="text-sm font-medium">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Getting Started Guides */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Getting Started Guides</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Card
              key={guide.title}
              className="group cursor-pointer transition-all hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${guide.bg}`}>
                    <guide.icon className={`h-5 w-5 ${guide.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">{guide.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {guide.steps} steps
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {guide.time}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Frequently Asked Questions</h2>

        {/* Category filter */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFaqCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                faqCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredFaqs.map((faq) => (
            <Card
              key={faq.id}
              className={`cursor-pointer transition-all ${
                expandedFaq === faq.id ? "ring-1 ring-blue-500/20" : ""
              }`}
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {faq.category}
                      </Badge>
                    </div>
                    {expandedFaq === faq.id && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-0">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <MessageCircle className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          <h3 className="mt-3 text-lg font-semibold">Still Need Help?</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Our support team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="mt-6 flex gap-3">
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

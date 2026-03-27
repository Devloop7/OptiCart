"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Import,
  DollarSign,
  PackageCheck,
  Brain,
  Store,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Search,
    title: "Product Discovery",
    desc: "Browse 10,000+ winning products sourced directly from AliExpress and verified suppliers.",
  },
  {
    icon: Import,
    title: "One-Click Import",
    desc: "Import products with images, variants, and descriptions to your store in a single click.",
  },
  {
    icon: DollarSign,
    title: "Smart Pricing",
    desc: "Set automatic markup rules, round prices, and maintain healthy margins effortlessly.",
  },
  {
    icon: PackageCheck,
    title: "Order Automation",
    desc: "Orders are placed and tracked automatically — no manual fulfillment needed.",
  },
  {
    icon: Brain,
    title: "AI Product Research",
    desc: "Let AI analyze trends, competition, and demand to surface the most profitable products.",
  },
  {
    icon: Store,
    title: "Multi-Store Management",
    desc: "Run multiple Shopify, WooCommerce, or eBay stores from one unified dashboard.",
  },
];

const steps = [
  {
    num: "01",
    title: "Browse & Import Products",
    desc: "Search our curated catalog or connect directly to AliExpress. Import any product to your store with one click.",
  },
  {
    num: "02",
    title: "Set Pricing Rules",
    desc: "Configure automatic markup percentages, rounding rules, and competitor-based pricing strategies.",
  },
  {
    num: "03",
    title: "Automate Orders",
    desc: "When a customer orders, OptiCart places the supplier order, syncs tracking, and notifies your buyer — hands-free.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started with the basics",
    cta: "Start Free",
    featured: false,
    features: [
      "25 products",
      "1 store",
      "Manual order processing",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "For growing sellers",
    cta: "Get Started",
    featured: false,
    features: [
      "500 products",
      "2 stores",
      "Semi-auto order processing",
      "Smart pricing rules",
      "Email support",
      "Basic AI research",
    ],
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    desc: "For serious dropshippers",
    cta: "Go Pro",
    featured: true,
    features: [
      "5,000 products",
      "5 stores",
      "Full order automation",
      "Advanced pricing engine",
      "Priority support",
      "AI product research",
      "Competitor monitoring",
    ],
  },
  {
    name: "Scale",
    price: "$199",
    period: "/mo",
    desc: "For high-volume operations",
    cta: "Contact Sales",
    featured: false,
    features: [
      "Unlimited products",
      "Unlimited stores",
      "Full order automation",
      "Custom pricing rules",
      "Dedicated account manager",
      "Advanced AI suite",
      "API access",
      "White-label options",
    ],
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "6-Figure Shopify Seller",
    avatar: "SC",
    quote:
      "OptiCart cut my order processing time by 90%. I went from spending 4 hours a day on fulfillment to barely 20 minutes. Revenue is up 3x since switching.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Multi-Store Owner",
    avatar: "MJ",
    quote:
      "Managing 3 stores used to be a nightmare. Now I run all of them from one dashboard. The AI product research alone has paid for the subscription 10x over.",
    stars: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "eBay Power Seller",
    avatar: "ER",
    quote:
      "The smart pricing feature is genius. It automatically adjusts my margins based on competition and I haven't had a single pricing mistake in 6 months.",
    stars: 5,
  },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "API Reference", "Community", "Status"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Opti<span className="text-indigo-400">Cart</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition">
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
            >
              Start Free
            </Link>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-950 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-sm text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/login" className="block text-sm text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link href="/register" className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-500" onClick={() => setMobileMenuOpen(false)}>Start Free</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 pt-32 pb-24 md:pt-44 md:pb-32">
        {/* gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <Zap className="h-4 w-4" />
            Trusted by 12,000+ dropshippers worldwide
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Automate Your{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Dropshipping Empire
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
            Source winning products from AliExpress, import them in one click,
            set smart pricing rules, and automate every order — all from a
            single dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-gray-600 hover:text-white transition"
            >
              See Demo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            No credit card required. Free plan available forever.
          </p>
        </div>
      </section>

      {/* ── Stats Counter ────────────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "12,000+", label: "Active Sellers" },
              { value: "2.5M+", label: "Products Imported" },
              { value: "$47M+", label: "Revenue Generated" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900 md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations Logos ───────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Integrates with your favorite platforms
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { name: "Shopify", icon: "🛍️" },
              { name: "AliExpress", icon: "🛒" },
              { name: "AutoDS", icon: "🤖" },
              { name: "CJ Dropshipping", icon: "📦" },
              { name: "Spocket", icon: "🚀" },
              { name: "DSers", icon: "⚡" },
              { name: "Zendrop", icon: "💎" },
              { name: "WooCommerce", icon: "🔮" },
            ].map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm"
              >
                <span className="text-xl">{platform.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Tools for Modern Dropshippers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From product research to order fulfillment, OptiCart handles the
              entire workflow so you can focus on growing your business.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-indigo-200"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Simple &amp; fast
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Up and Running in 3 Steps
            </h2>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="relative text-center md:text-left">
                <span className="text-5xl font-extrabold text-indigo-100">
                  {s.num}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Transparent pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Plans That Scale With You
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free and upgrade as your business grows. No hidden fees.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition ${
                  p.featured
                    ? "border-indigo-600 bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-600"
                    : "border-gray-200 bg-white shadow-sm hover:shadow-md"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.desc}</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-sm text-gray-500">{p.period}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {p.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition ${
                    p.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Loved by sellers
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What Our Users Say
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-indigo-400" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start Your Free Store Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Join thousands of entrepreneurs automating their dropshipping
            business with OptiCart. No credit card required.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="text-xl font-bold tracking-tight">
                Opti<span className="text-indigo-600">Cart</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                The all-in-one dropshipping automation platform for modern
                e-commerce entrepreneurs.
              </p>
            </div>

            {/* link columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                  {heading}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-gray-500 hover:text-gray-900 transition"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} OptiCart. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  CheckCircle2, Zap, Shield, Globe, Star,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = password.length >= 12 ? "strong" : password.length >= 8 ? "good" : password.length > 0 ? "weak" : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", { email, password, redirect: false });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950">
        <div className="pointer-events-none absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link href="/" className="text-2xl font-bold text-white">
            Opti<span className="text-indigo-400">Cart</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Start your dropshipping business in minutes
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Join thousands of sellers using OptiCart to find winning products, connect stores, and automate fulfillment.
            </p>

            {/* Social proof */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gray-300 italic">
                    &ldquo;OptiCart saved me hours every day. The product discovery and auto-import is incredible.&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-gray-500">— Sarah C., Shopify Seller</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              {[
                { icon: CheckCircle2, text: "Free forever plan" },
                { icon: CheckCircle2, text: "No credit card" },
                { icon: CheckCircle2, text: "Setup in 2 min" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <item.icon className="h-3 w-3 text-emerald-500" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Trusted by 12,000+ sellers worldwide
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-bold">
              Opti<span className="text-indigo-500">Cart</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Start automating your dropshipping business</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Min 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4 text-zinc-400" /> : <Eye className="h-4 w-4 text-zinc-400" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === "weak" ? "bg-red-400" : passwordStrength === "good" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === "good" ? "bg-amber-400" : passwordStrength === "strong" ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength === "strong" ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${passwordStrength === "weak" ? "text-red-500" : passwordStrength === "good" ? "text-amber-500" : "text-emerald-500"}`}>
                    {passwordStrength === "weak" ? "Weak" : passwordStrength === "good" ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-zinc-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

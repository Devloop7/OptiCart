"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Zap, Shield, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link href="/" className="text-2xl font-bold text-white">
            Opti<span className="text-indigo-400">Cart</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Automate your dropshipping business
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Source products, manage stores, and fulfill orders — all from one powerful dashboard.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Globe, text: "Source from AliExpress, CJ Dropshipping & more" },
                { icon: Zap, text: "Automated order fulfillment & price sync" },
                { icon: Shield, text: "Secure OAuth store connections" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                    <item.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>Trusted by 12,000+ sellers</span>
            <span>99.9% uptime</span>
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-bold">
              Opti<span className="text-indigo-500">Cart</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your OptiCart account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                <span className="shrink-0 text-red-500">!</span>
                {error}
              </div>
            )}

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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Create free account
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 mb-1.5">Demo Accounts</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p><span className="font-mono text-zinc-600 dark:text-zinc-300">admin@opticart.app</span> / Admin1234!</p>
              <p><span className="font-mono text-zinc-600 dark:text-zinc-300">demo@opticart.app</span> / Demo1234!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

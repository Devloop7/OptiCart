"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  Package,
  Truck,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ProfitCalculatorPage() {
  const [cost, setCost] = useState("8.99");
  const [shipping, setShipping] = useState("0");
  const [markup, setMarkup] = useState("2.5");
  const [adCost, setAdCost] = useState("0");
  const [platformFee, setPlatformFee] = useState("2.9");
  const [txnFee, setTxnFee] = useState("0.30");

  const supplierCost = parseFloat(cost) || 0;
  const shippingCost = parseFloat(shipping) || 0;
  const markupMultiplier = parseFloat(markup) || 2.5;
  const adSpend = parseFloat(adCost) || 0;
  const platformPct = parseFloat(platformFee) || 0;
  const txnFixed = parseFloat(txnFee) || 0;

  const retailPrice = (supplierCost + shippingCost) * markupMultiplier;
  const platformFeeAmount = retailPrice * (platformPct / 100) + txnFixed;
  const totalCost = supplierCost + shippingCost + adSpend + platformFeeAmount;
  const profit = retailPrice - totalCost;
  const margin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const breakEvenUnits = adSpend > 0 && profit > 0 ? Math.ceil(adSpend / profit) : 0;

  function reset() {
    setCost("8.99");
    setShipping("0");
    setMarkup("2.5");
    setAdCost("0");
    setPlatformFee("2.9");
    setTxnFee("0.30");
  }

  const profitColor =
    profit > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : profit < 0
      ? "text-red-600 dark:text-red-400"
      : "text-zinc-500";

  const marginColor =
    margin >= 40
      ? "text-emerald-600 dark:text-emerald-400"
      : margin >= 20
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit Calculator</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Calculate your profit margins, ROI, and break-even points
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
          <RefreshCw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Product Costs</CardTitle>
              <CardDescription className="text-xs">Enter your supplier and shipping costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                  Supplier Cost ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-zinc-400" />
                  Shipping Cost ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                  Markup Multiplier (x)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="20"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  className="mt-1"
                />
                <div className="mt-2 flex gap-1.5">
                  {["1.5", "2.0", "2.5", "3.0", "4.0"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMarkup(m)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        markup === m
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Costs</CardTitle>
              <CardDescription className="text-xs">Ads and platform fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-zinc-400" />
                  Ad Spend per Sale ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adCost}
                  onChange={(e) => setAdCost(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-zinc-400" />
                    Platform Fee (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                    Txn Fee ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={txnFee}
                    onChange={(e) => setTxnFee(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                Default: Shopify Payments (2.9% + $0.30)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results section */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Retail price */}
              <div className="text-center">
                <p className="text-xs text-zinc-500">Recommended Retail Price</p>
                <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  ${retailPrice.toFixed(2)}
                </p>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-zinc-800">
                  <p className="text-[10px] font-medium text-zinc-400">Profit</p>
                  <p className={`text-lg font-bold ${profitColor}`}>
                    ${profit.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-zinc-800">
                  <p className="text-[10px] font-medium text-zinc-400">Margin</p>
                  <p className={`text-lg font-bold ${marginColor}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-zinc-800">
                  <p className="text-[10px] font-medium text-zinc-400">ROI</p>
                  <p className={`text-lg font-bold ${profitColor}`}>
                    {roi.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Margin indicator */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Profit Margin</span>
                  <Badge
                    variant={margin >= 40 ? "success" : margin >= 20 ? "warning" : "destructive"}
                    className="text-[10px]"
                  >
                    {margin >= 40 ? "Excellent" : margin >= 20 ? "Good" : "Low"}
                  </Badge>
                </div>
                <div className="h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      margin >= 40
                        ? "bg-emerald-500"
                        : margin >= 20
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { label: "Supplier Cost", value: supplierCost, color: "bg-blue-500" },
                  { label: "Shipping", value: shippingCost, color: "bg-cyan-500" },
                  { label: "Ad Spend", value: adSpend, color: "bg-violet-500" },
                  { label: "Platform Fee", value: platformFeeAmount, color: "bg-amber-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium">${item.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-400 shrink-0" />
                    <span className="flex-1 text-sm font-semibold">Total Cost</span>
                    <span className="text-sm font-bold">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Net Profit
                  </span>
                  <span className={`text-sm font-bold ${profitColor}`}>
                    ${profit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Break-even */}
              {adSpend > 0 && profit > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Break-even: {breakEvenUnits} units to cover ad spend
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Volume Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[10, 50, 100, 500].map((units) => (
                  <div
                    key={units}
                    className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                  >
                    <p className="text-[10px] text-zinc-400">{units} units</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${(profit * units).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      ${(retailPrice * units).toFixed(0)} rev
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

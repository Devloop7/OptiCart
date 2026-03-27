"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, CreditCard, AlertTriangle } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  subscriptionTier: string;
  maxStores: number;
  maxProducts: number;
  createdAt: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    stockAlerts: true,
    orderUpdates: true,
    weeklyReport: false,
  });

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setProfile(json.data);
          setName(json.data.name || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.ok) setProfile(json.data);
    } finally {
      setSaving(false);
    }
  };

  const tierColors: Record<string, string> = {
    FREE: "secondary",
    STARTER: "default",
    PRO: "success",
    ENTERPRISE: "warning",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>Your current plan and usage limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={tierColors[profile?.subscriptionTier || "FREE"] as "default"}>
              {profile?.subscriptionTier} Plan
            </Badge>
            <span className="text-sm text-zinc-500">
              Member since {profile ? new Date(profile.createdAt).toLocaleDateString() : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="text-xs text-zinc-500">Max Stores</div>
              <div className="text-lg font-semibold">{profile?.maxStores}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="text-xs text-zinc-500">Max Products</div>
              <div className="text-lg font-semibold">{profile?.maxProducts.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="text-xs text-zinc-500">Plan</div>
              <div className="text-lg font-semibold">{profile?.subscriptionTier}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">Upgrade Plan</Button>
            <Button variant="ghost" size="sm">View Billing History</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Control what alerts you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div>
                <div className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-xs text-zinc-500">
                  {key === "priceAlerts" && "Get notified when supplier prices change significantly"}
                  {key === "stockAlerts" && "Alert when products go out of stock"}
                  {key === "orderUpdates" && "Updates on order status changes"}
                  {key === "weeklyReport" && "Weekly summary of your store performance"}
                </div>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !value }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm">Change Password</Button>
          <div className="text-xs text-zinc-500">
            Password must be at least 8 characters with uppercase, lowercase, and numbers.
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Delete Account</div>
              <div className="text-xs text-zinc-500">Permanently delete your account and all data.</div>
            </div>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

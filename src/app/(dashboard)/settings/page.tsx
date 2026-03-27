"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Store, Shield } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  email: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
}

interface StoreInfo {
  id: string;
  name: string;
  platform: string;
  domain: string | null;
  isActive: boolean;
}

type Tab = "profile" | "workspace" | "stores";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");

  // Workspace
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsName, setWsName] = useState("");
  const [wsCurrency, setWsCurrency] = useState("USD");
  const [wsTimezone, setWsTimezone] = useState("America/New_York");

  // Stores
  const [stores, setStores] = useState<StoreInfo[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/profile").then((r) => r.json()).catch(() => ({ ok: false })),
      fetch("/api/settings/workspace").then((r) => r.json()).catch(() => ({ ok: false })),
      fetch("/api/stores").then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([profJson, wsJson, storesJson]) => {
      if (profJson.ok && profJson.data) {
        setProfile(profJson.data);
        setName(profJson.data.name ?? "");
      }
      if (wsJson.ok && wsJson.data) {
        setWorkspace(wsJson.data);
        setWsName(wsJson.data.name);
        setWsCurrency(wsJson.data.currency);
        setWsTimezone(wsJson.data.timezone);
      }
      if (storesJson.ok) {
        setStores(storesJson.data ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.ok) setProfile(json.data);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkspace() {
    setSaving(true);
    try {
      await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName, currency: wsCurrency, timezone: wsTimezone }),
      });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "stores", label: "Stores", icon: Store },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                <Input value={profile?.email ?? ""} disabled className="mt-1" />
              </div>
            </div>
            <div>
              <Button onClick={saveProfile} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium">Security</span>
            </div>
            <Button variant="outline" size="sm">Change Password</Button>
          </CardContent>
        </Card>
      )}

      {/* Workspace */}
      {tab === "workspace" && (
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Configure your workspace settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Workspace Name</label>
              <Input value={wsName} onChange={(e) => setWsName(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Currency</label>
                <Select value={wsCurrency} onValueChange={setWsCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="ILS">ILS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Timezone</label>
                <Select value={wsTimezone} onValueChange={setWsTimezone}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Asia/Jerusalem">Jerusalem (IST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveWorkspace} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stores */}
      {tab === "stores" && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Stores</CardTitle>
            <CardDescription>Manage your e-commerce store connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stores.length === 0 ? (
              <p className="text-sm text-zinc-400">No stores connected yet.</p>
            ) : (
              stores.map((store) => (
                <div key={store.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                  <div>
                    <p className="font-medium text-sm">{store.name}</p>
                    <p className="text-xs text-zinc-500">{store.platform} {store.domain ? `- ${store.domain}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={store.isActive ? "success" : "secondary"}>
                      {store.isActive ? "Connected" : "Disconnected"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {store.isActive ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2">
              <Store className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

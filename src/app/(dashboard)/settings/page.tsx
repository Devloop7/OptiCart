"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Store, Shield, AlertTriangle, Key, Eye, EyeOff } from "lucide-react";

function PasswordChangeForm({ onMessage }: { onMessage: (type: "success" | "error", text: string) => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (newPw.length < 8) {
      onMessage("error", "Password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      onMessage("error", "Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (json.ok) {
        onMessage("success", "Password changed successfully.");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        onMessage("error", json.error || "Failed to change password");
      }
    } catch {
      onMessage("error", "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Password</label>
        <div className="relative mt-1">
          <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            type={showPw ? "text" : "password"}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="pl-9 pr-9"
            placeholder="Enter current password"
          />
          <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPw ? <EyeOff className="h-3.5 w-3.5 text-zinc-400" /> : <Eye className="h-3.5 w-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New Password</label>
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1" placeholder="Min 8 characters" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm</label>
          <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1" placeholder="Confirm password" />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={saving || !currentPw || !newPw} size="sm">
        {saving ? "Changing..." : "Change Password"}
      </Button>
    </div>
  );
}

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

type Tab = "profile" | "workspace" | "stores" | "danger";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

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
      if (json.ok) {
        setProfile(json.data);
        showMessage("success", "Profile saved.");
      } else {
        showMessage("error", json.error ?? "Failed to save profile.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkspace() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName, currency: wsCurrency, timezone: wsTimezone }),
      });
      const json = await res.json();
      if (json.ok) {
        showMessage("success", "Workspace settings saved.");
      } else {
        showMessage("error", json.error ?? "Failed to save workspace.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "stores", label: "Stores", icon: Store },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
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

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === "success"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
            : "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
        }`}>
          {message.text}
        </div>
      )}

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
              <span className="text-sm font-medium">Change Password</span>
            </div>
            <PasswordChangeForm onMessage={showMessage} />
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
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = "/stores"}>
              <Store className="mr-2 h-4 w-4" />
              Manage Stores
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {tab === "danger" && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions. Please be careful.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-red-200 p-4 dark:border-red-900">
              <div>
                <p className="text-sm font-medium">Delete All Products</p>
                <p className="text-xs text-zinc-500">Remove all products from your catalog. This cannot be undone.</p>
              </div>
              <Button variant="destructive" size="sm">Delete Products</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 p-4 dark:border-red-900">
              <div>
                <p className="text-sm font-medium">Disconnect All Stores</p>
                <p className="text-xs text-zinc-500">Remove all store connections and their data.</p>
              </div>
              <Button variant="destructive" size="sm">Disconnect All</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 p-4 dark:border-red-900">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-zinc-500">Permanently delete your account and all associated data.</p>
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

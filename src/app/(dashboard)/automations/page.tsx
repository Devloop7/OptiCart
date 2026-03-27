"use client";

import { useEffect, useState } from "react";
import { Zap, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AutomationRule {
  id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, unknown>;
  frequencyMinutes: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  createdAt: string;
}

interface AutomationRun {
  id: string;
  ruleId: string;
  ruleName: string;
  status: string;
  summary: string | null;
  startedAt: string;
  finishedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  STOCK_SYNC: "Stock Sync",
  PRICE_SYNC: "Price Sync",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ERROR: "destructive",
};

const RUN_STATUS_ICONS: Record<string, React.ElementType> = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  RUNNING: Clock,
};

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("STOCK_SYNC");
  const [formFreq, setFormFreq] = useState("60");
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/watcher").then((r) => r.json()).catch(() => ({ ok: false })),
      fetch("/api/watcher/runs").then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([rulesJson, runsJson]) => {
      if (rulesJson.ok) setRules(rulesJson.data ?? []);
      if (runsJson.ok) setRuns(runsJson.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function toggleStatus(rule: AutomationRule) {
    const newStatus = rule.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/watcher/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      // silent
    }
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    setFormSaving(true);
    try {
      const res = await fetch("/api/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type: formType,
          frequencyMinutes: parseInt(formFreq, 10),
          config: formType === "STOCK_SYNC"
            ? { minStock: 5, action: "pause_product" }
            : { applyPricingRule: true, notifyOnChange: true },
        }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setRules((prev) => [...prev, json.data]);
        setFormOpen(false);
        setFormName("");
      }
    } catch {
      // silent
    } finally {
      setFormSaving(false);
    }
  }

  function formatFrequency(minutes: number) {
    if (minutes < 60) return `Every ${minutes}m`;
    if (minutes < 1440) return `Every ${minutes / 60}h`;
    return `Every ${minutes / 1440}d`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Automations</h1>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automations</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Zap className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">No automation rules yet</p>
            <p className="text-xs mt-1">Create rules to auto-sync stock and prices</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900">
                  <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {TYPE_LABELS[rule.type] ?? rule.type}
                    </Badge>
                    <Badge variant={STATUS_COLORS[rule.status] ?? "secondary"} className="text-[10px]">
                      {rule.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{formatFrequency(rule.frequencyMinutes)}</span>
                    {rule.lastRunAt && (
                      <span>Last run: {new Date(rule.lastRunAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(rule)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rule.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rule.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.slice(0, 10).map((run) => {
              const Icon = RUN_STATUS_ICONS[run.status] ?? AlertTriangle;
              const color = run.status === "SUCCESS" ? "text-emerald-500" : run.status === "FAILED" ? "text-red-500" : "text-zinc-400";
              return (
                <div key={run.id} className="flex items-center gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{run.ruleName}</p>
                    {run.summary && <p className="text-xs text-zinc-500">{run.summary}</p>}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(run.startedAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Pause out of stock products"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK_SYNC">Stock Sync</SelectItem>
                  <SelectItem value="PRICE_SYNC">Price Sync</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Frequency</label>
              <Select value={formFreq} onValueChange={setFormFreq}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                  <SelectItem value="1440">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={formSaving || !formName.trim()}>
                {formSaving ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

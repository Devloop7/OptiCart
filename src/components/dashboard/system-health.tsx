"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, RefreshCw, AlertTriangle } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  latencyMs: number;
  message?: string;
}

interface HealthReport {
  overall: "healthy" | "degraded" | "critical";
  services: ServiceStatus[];
  isLocked: boolean;
  lockReason?: string;
  failedLoginCount: number;
  timestamp: string;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      if (json.ok) setHealth(json.data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const toggleKillSwitch = async () => {
    if (!health) return;
    setKillSwitchLoading(true);
    try {
      if (health.isLocked) {
        await fetch("/api/system/kill-switch", { method: "DELETE", body: JSON.stringify({ unlockedBy: "admin" }) });
      } else {
        await fetch("/api/system/kill-switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Manual lockdown via dashboard", lockedBy: "admin" }),
        });
      }
      await fetchHealth();
    } finally {
      setKillSwitchLoading(false);
    }
  };

  const statusBadgeVariant = (s: "online" | "offline" | "degraded") =>
    s === "online" ? "success" as const : s === "degraded" ? "warning" as const : "destructive" as const;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <RefreshCw className="h-4 w-4 animate-spin" /> Checking system health...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="border-red-300 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Unable to reach health endpoint
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={health.isLocked ? "border-red-500 dark:border-red-700" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">System Health</CardTitle>
          <Badge variant={health.overall === "healthy" ? "success" : health.overall === "degraded" ? "warning" : "destructive"}>
            {health.overall.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service statuses */}
        <div className="space-y-2">
          {health.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  service.status === "online" ? "bg-green-500" :
                  service.status === "degraded" ? "bg-yellow-500" : "bg-red-500"
                }`} />
                <span>{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(service.status)} className="text-[10px]">
                  {service.status === "online" ? "Online" : service.status === "degraded" ? "Degraded" : "Offline"}
                </Badge>
                <span className="text-xs text-zinc-400">{service.latencyMs}ms</span>
              </div>
            </div>
          ))}
        </div>

        {/* Failed login warning */}
        {health.failedLoginCount >= 3 && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-2 text-xs text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            {health.failedLoginCount} failed login attempts in the last 24h
          </div>
        )}

        {/* Kill Switch */}
        {health.isLocked && health.lockReason && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
            <strong>Locked:</strong> {health.lockReason}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant={health.isLocked ? "default" : "destructive"}
            size="sm"
            onClick={toggleKillSwitch}
            disabled={killSwitchLoading}
            className="w-full"
          >
            {killSwitchLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : health.isLocked ? (
              <><Shield className="h-4 w-4" /> Unlock API (Deactivate Kill Switch)</>
            ) : (
              <><ShieldOff className="h-4 w-4" /> Kill Switch (Lock All APIs)</>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchHealth} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

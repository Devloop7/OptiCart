"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Pause, Play, AlertTriangle, CheckCircle, Clock, RefreshCw, Eye } from "lucide-react";

interface WatcherTask {
  id: string;
  productId: string;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "COMPLETED";
  intervalMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  consecutiveFails: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    title: string;
    supplierPrice: string;
    sellingPrice: string;
    status: string;
    store: { name: string };
  };
}

interface WatcherStats {
  active: number;
  paused: number;
  error: number;
  completed: number;
}

const statusConfig = {
  ACTIVE: { color: "success" as const, icon: Play, label: "Active" },
  PAUSED: { color: "warning" as const, icon: Pause, label: "Paused" },
  ERROR: { color: "destructive" as const, icon: AlertTriangle, label: "Error" },
  COMPLETED: { color: "secondary" as const, icon: CheckCircle, label: "Completed" },
};

function timeAgo(date: string | null) {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function WatcherPage() {
  const [tasks, setTasks] = useState<WatcherTask[]>([]);
  const [stats, setStats] = useState<WatcherStats>({ active: 0, paused: 0, error: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<WatcherTask | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    params.set("limit", "50");

    fetch(`/api/watcher?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setTasks(json.data.tasks);
          setStats(json.data.stats);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filter]);

  const toggleTask = async (taskId: string, newStatus: "ACTIVE" | "PAUSED") => {
    await fetch(`/api/watcher/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const total = stats.active + stats.paused + stats.error + stats.completed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price & Stock Watcher</h1>
          <p className="text-sm text-zinc-500">Monitor supplier prices and stock levels 24/7</p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="cursor-pointer" onClick={() => setFilter("ACTIVE")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Active</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
              </div>
              <Play className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("PAUSED")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Paused</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
              </div>
              <Pause className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("ERROR")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Errors</div>
                <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Total</div>
                <div className="text-2xl font-bold">{total}</div>
              </div>
              <Activity className="h-8 w-8 text-zinc-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "ACTIVE", "PAUSED", "ERROR", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="text-zinc-500">No watcher tasks found</p>
            <p className="text-xs text-zinc-400 mt-1">Tasks are created automatically when products are added</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const config = statusConfig[task.status];
            const Icon = config.icon;
            return (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`rounded-full p-2 ${
                        task.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-950" :
                        task.status === "PAUSED" ? "bg-yellow-100 dark:bg-yellow-950" :
                        task.status === "ERROR" ? "bg-red-100 dark:bg-red-950" :
                        "bg-zinc-100 dark:bg-zinc-800"
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          task.status === "ACTIVE" ? "text-emerald-600" :
                          task.status === "PAUSED" ? "text-yellow-600" :
                          task.status === "ERROR" ? "text-red-600" :
                          "text-zinc-500"
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{task.product.title}</span>
                          <Badge variant={config.color} className="text-[10px] shrink-0">{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                          <span>{task.product.store.name}</span>
                          <span>Every {task.intervalMinutes}min</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last: {timeAgo(task.lastRunAt)}
                          </span>
                          {task.consecutiveFails > 0 && (
                            <span className="text-red-500">{task.consecutiveFails} fails</span>
                          )}
                        </div>
                        {task.lastError && (
                          <div className="mt-1 text-xs text-red-500 truncate">{task.lastError}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right text-xs text-zinc-500 hidden sm:block">
                        <div>Cost: ${Number(task.product.supplierPrice).toFixed(2)}</div>
                        <div>Sell: ${Number(task.product.sellingPrice).toFixed(2)}</div>
                      </div>
                      {task.status === "ACTIVE" ? (
                        <Button size="sm" variant="outline" onClick={() => toggleTask(task.id, "PAUSED")}>
                          <Pause className="h-3 w-3 mr-1" /> Pause
                        </Button>
                      ) : task.status === "PAUSED" || task.status === "ERROR" ? (
                        <Button size="sm" variant="outline" onClick={() => toggleTask(task.id, "ACTIVE")}>
                          <Play className="h-3 w-3 mr-1" /> Resume
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

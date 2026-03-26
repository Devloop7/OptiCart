import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Pause, AlertTriangle } from "lucide-react";

interface WatcherStats {
  active: number;
  paused: number;
  error: number;
}

export function AutomationStatus({ stats }: { stats: WatcherStats }) {
  const total = stats.active + stats.paused + stats.error;
  const isHealthy = stats.error === 0 && stats.active > 0;
  const isDegraded = stats.error > 0 && stats.active > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Automation</CardTitle>
          <Badge variant={isHealthy ? "success" : isDegraded ? "warning" : "destructive"}>
            {isHealthy ? "Healthy" : isDegraded ? "Degraded" : total === 0 ? "Inactive" : "Error"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Monitoring</span>
            </div>
            <span className="font-medium">{stats.active} products</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              <span>Paused</span>
            </div>
            <span className="font-medium">{stats.paused} products</span>
          </div>
          {stats.error > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Errors</span>
              </div>
              <span className="font-medium text-red-600">{stats.error} products</span>
            </div>
          )}
        </div>
        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="flex h-full">
              <div className="bg-green-500" style={{ width: `${(stats.active / total) * 100}%` }} />
              <div className="bg-yellow-500" style={{ width: `${(stats.paused / total) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(stats.error / total) * 100}%` }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

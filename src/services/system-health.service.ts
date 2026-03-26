import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  latencyMs: number;
  message?: string;
}

export interface SystemHealthReport {
  overall: "healthy" | "degraded" | "critical";
  services: ServiceStatus[];
  isLocked: boolean;
  lockReason?: string;
  failedLoginCount: number;
  timestamp: Date;
}

export class SystemHealthService {

  static async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await db.$queryRaw`SELECT 1`;
      return { name: "Database", status: "online", latencyMs: Date.now() - start };
    } catch (err) {
      return {
        name: "Database",
        status: "offline",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  static async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const pong = await redis.ping();
      return {
        name: "Auto-Orderer (Redis/Queue)",
        status: pong === "PONG" ? "online" : "degraded",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        name: "Auto-Orderer (Redis/Queue)",
        status: "offline",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  static async checkSourcingEngine(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await redis.ping();
      const activeWatchers = await db.watcherTask.count({
        where: { status: "ACTIVE" },
      }).catch(() => -1);

      if (activeWatchers === -1) {
        return {
          name: "Sourcing Engine",
          status: "degraded",
          latencyMs: Date.now() - start,
          message: "Cannot verify watcher task status",
        };
      }

      return {
        name: "Sourcing Engine",
        status: "online",
        latencyMs: Date.now() - start,
        message: `${activeWatchers} active monitoring tasks`,
      };
    } catch (err) {
      return {
        name: "Sourcing Engine",
        status: "offline",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  static async getHealthReport(): Promise<SystemHealthReport> {
    const [dbStatus, redisStatus, sourcingStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkSourcingEngine(),
    ]);

    const services = [sourcingStatus, redisStatus, dbStatus];

    let isLocked = false;
    let lockReason: string | undefined;
    try {
      const lock = await db.systemLock.findFirst({ where: { isLocked: true } });
      if (lock) {
        isLocked = true;
        lockReason = lock.reason || undefined;
      }
    } catch { /* DB issue already captured */ }

    let failedLoginCount = 0;
    try {
      failedLoginCount = await db.activityLog.count({
        where: {
          action: "FAILED_LOGIN",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
    } catch { /* ignore */ }

    const offlineCount = services.filter((s) => s.status === "offline").length;
    const degradedCount = services.filter((s) => s.status === "degraded").length;

    let overall: "healthy" | "degraded" | "critical" = "healthy";
    if (offlineCount > 0) overall = "critical";
    else if (degradedCount > 0 || isLocked) overall = "degraded";

    return { overall, services, isLocked, lockReason, failedLoginCount, timestamp: new Date() };
  }

  static async activateKillSwitch(reason: string, lockedBy: string): Promise<void> {
    const existing = await db.systemLock.findFirst();
    if (existing) {
      await db.systemLock.update({
        where: { id: existing.id },
        data: { isLocked: true, reason, lockedBy, lockedAt: new Date() },
      });
    } else {
      await db.systemLock.create({
        data: { isLocked: true, reason, lockedBy, lockedAt: new Date() },
      });
    }

    await db.activityLog.create({
      data: {
        action: "KILL_SWITCH_ACTIVATED",
        details: JSON.stringify({ reason, lockedBy }),
        severity: "critical",
      },
    });
  }

  static async deactivateKillSwitch(unlockedBy: string): Promise<void> {
    await db.systemLock.updateMany({
      where: { isLocked: true },
      data: { isLocked: false, reason: null, lockedBy: null, lockedAt: null },
    });

    await db.activityLog.create({
      data: {
        action: "KILL_SWITCH_DEACTIVATED",
        details: JSON.stringify({ unlockedBy }),
        severity: "info",
      },
    });
  }

  static async checkSecurityThreshold(): Promise<boolean> {
    const threshold = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || "5");
    const windowMs = 15 * 60 * 1000;

    const recentFailures = await db.activityLog.count({
      where: {
        action: "FAILED_LOGIN",
        createdAt: { gte: new Date(Date.now() - windowMs) },
      },
    });

    if (recentFailures >= threshold) {
      const alreadyLocked = await db.systemLock.findFirst({ where: { isLocked: true } });
      if (!alreadyLocked) {
        await this.activateKillSwitch(
          `Auto-lockdown: ${recentFailures} failed login attempts in 15 minutes`,
          "system"
        );
        return true;
      }
    }
    return false;
  }
}

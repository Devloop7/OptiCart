import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

interface PanicEntry {
  action: string;
  context: string;
  timestamp: Date;
}

const MAX_ENTRIES = 10;

/**
 * PanicLogger: Records the last 10 actions before a crash.
 * Can export to a plain .txt file for instant debugging.
 *
 * Usage:
 *   const logger = new PanicLogger();
 *   logger.log("FETCH_PRODUCT", "Fetching product xyz from AliExpress");
 *   logger.log("PARSE_PRICE", "Parsing price from page HTML");
 *   // ... if crash happens:
 *   await logger.flush(); // saves to DB
 *   await PanicLogger.exportToFile(); // creates panic-log-2024-01-15T12-00-00.txt
 */
export class PanicLogger {
  private entries: PanicEntry[] = [];

  log(action: string, context: string): void {
    this.entries.push({
      action,
      context,
      timestamp: new Date(),
    });

    // Keep only the last MAX_ENTRIES
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }

  /**
   * Flush current entries to the database
   */
  async flush(): Promise<void> {
    if (this.entries.length === 0) return;

    try {
      await db.panicLog.createMany({
        data: this.entries.map((e) => ({
          action: e.action,
          context: e.context,
          error: null,
          timestamp: e.timestamp,
        })),
      });
    } catch (dbErr) {
      // If DB is down, write to stderr as last resort
      console.error("[PanicLogger] Failed to flush to DB, writing to stderr:");
      for (const entry of this.entries) {
        console.error(`  [${entry.timestamp.toISOString()}] ${entry.action}: ${entry.context}`);
      }
    }
  }

  /**
   * Flush with error context (called during crash)
   */
  async flushWithError(error: unknown): Promise<void> {
    const errorStr = error instanceof Error
      ? `${error.message}\n${error.stack}`
      : String(error);

    // Add the error as the final entry
    this.log("CRASH", errorStr);
    await this.flush();
  }

  /**
   * Export the last 10 panic log entries from DB to a .txt file
   * Returns the file path
   */
  static async exportToFile(): Promise<string> {
    const entries = await db.panicLog.findMany({
      orderBy: { timestamp: "desc" },
      take: MAX_ENTRIES,
    });

    if (entries.length === 0) {
      throw new Error("No panic log entries found");
    }

    // Build human-readable text
    const lines: string[] = [
      "═══════════════════════════════════════════════════════",
      "  OPTICART PANIC LOG",
      `  Exported: ${new Date().toISOString()}`,
      `  Entries: ${entries.length} (most recent first)`,
      "═══════════════════════════════════════════════════════",
      "",
    ];

    for (const entry of entries.reverse()) {
      lines.push(`[${entry.timestamp.toISOString()}] ${entry.action}`);
      if (entry.context) lines.push(`  Context: ${entry.context}`);
      if (entry.error) lines.push(`  Error: ${entry.error}`);
      lines.push("");
    }

    lines.push("═══════════════════════════════════════════════════════");
    lines.push("Send this file to your developer for diagnosis.");
    lines.push("═══════════════════════════════════════════════════════");

    // Write to file
    const logsDir = path.join(process.cwd(), "panic-logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(logsDir, `panic-log-${timestamp}.txt`);
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");

    return filePath;
  }

  /**
   * Get recent panic entries as structured data (for API/dashboard)
   */
  static async getRecent(limit = 10) {
    return db.panicLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Clear old panic logs (keep last 100)
   */
  static async cleanup(): Promise<number> {
    const cutoff = await db.panicLog.findFirst({
      orderBy: { timestamp: "desc" },
      skip: 100,
      select: { timestamp: true },
    });

    if (!cutoff) return 0;

    const result = await db.panicLog.deleteMany({
      where: { timestamp: { lt: cutoff.timestamp } },
    });

    return result.count;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { translateError, getErrorSeverity } from "./error-translator";
import { PanicLogger } from "./panic-logger";
import { db } from "./db";
import { ZodError } from "zod";

type ApiHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with:
 * 1. Automatic error translation to human-readable messages
 * 2. Panic logging on failure
 * 3. Activity log recording
 * 4. System lock checking (kill switch)
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ctx?: { params: Promise<Record<string, string>> }) => {
    const panicLogger = new PanicLogger();

    try {
      // Check kill switch
      const lock = await db.systemLock.findFirst({
        where: { isLocked: true },
      }).catch(() => null); // Don't fail if table doesn't exist yet

      if (lock) {
        return NextResponse.json(
          {
            ok: false,
            error: `System is locked: ${lock.reason || "Emergency lockdown active"}. Contact your administrator.`,
            code: "SYSTEM_LOCKED",
          },
          { status: 503 }
        );
      }

      panicLogger.log("API_REQUEST", `${req.method} ${req.url}`);

      const response = await handler(req, ctx);
      return response;

    } catch (err) {
      const humanMessage = translateError(err);
      const severity = getErrorSeverity(err);

      // Log to panic logger
      await panicLogger.flushWithError(err).catch(() => {});

      // Log to activity log
      try {
        await db.activityLog.create({
          data: {
            action: "API_ERROR",
            details: JSON.stringify({
              method: req.method,
              url: req.url,
              error: err instanceof Error ? err.message : String(err),
              humanMessage,
            }),
            severity,
          },
        });
      } catch {
        // If DB is also down, just log to console
        console.error("[ErrorHandler] Failed to log error:", err);
      }

      // Determine HTTP status
      let status = 500;
      if (err instanceof ZodError) status = 422;
      if (err instanceof Error) {
        if (err.message === "Unauthorized") status = 401;
        if (err.message.includes("not found") || err.message.includes("P2025")) status = 404;
      }

      return NextResponse.json(
        {
          ok: false,
          error: humanMessage,
          severity,
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              originalError: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            },
          }),
        },
        { status }
      );
    }
  };
}

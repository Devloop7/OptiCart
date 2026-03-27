import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return error("Validation error", 422, err.issues);
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return error("Unauthorized", 401);
    }
    if (err.message === "NO_WORKSPACE") {
      return error("No workspace found", 403);
    }
  }
  console.error("[API Error]", err);
  return error("Internal server error", 500);
}

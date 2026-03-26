import { NextRequest, NextResponse } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { PanicLogger } from "@/lib/panic-logger";

export async function GET() {
  try {
    const entries = await PanicLogger.getRecent(10);
    return success(entries);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "export") {
      const filePath = await PanicLogger.exportToFile();
      return success({ filePath, message: "Panic log exported successfully" });
    }

    if (action === "cleanup") {
      const deleted = await PanicLogger.cleanup();
      return success({ deleted, message: `Cleaned up ${deleted} old panic log entries` });
    }

    return NextResponse.json({ ok: false, error: "Invalid action. Use ?action=export or ?action=cleanup" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}

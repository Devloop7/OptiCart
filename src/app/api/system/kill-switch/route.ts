import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { SystemHealthService } from "@/services/system-health.service";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await SystemHealthService.activateKillSwitch(
      body.reason || "Manual lockdown via admin dashboard",
      body.lockedBy || "admin"
    );
    return success({ message: "Kill switch activated. All API endpoints are now locked." });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    await SystemHealthService.deactivateKillSwitch(body.unlockedBy || "admin");
    return success({ message: "Kill switch deactivated. API endpoints are now accessible." });
  } catch (err) {
    return handleApiError(err);
  }
}

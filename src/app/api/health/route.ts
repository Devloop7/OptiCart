import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { SystemHealthService } from "@/services/system-health.service";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const report = await SystemHealthService.getHealthReport();
    const status = report.overall === "critical" ? 503 : 200;
    return success(report, status);
  } catch (err) {
    return handleApiError(err);
  }
}

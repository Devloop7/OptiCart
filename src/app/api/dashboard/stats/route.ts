import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return error("userId query param required", 400);
    const stats = await AnalyticsService.getDashboardStats(userId);
    return success(stats);
  } catch (err) {
    return handleApiError(err);
  }
}

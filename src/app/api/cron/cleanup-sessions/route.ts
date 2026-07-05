import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteExpiredSessions } from "@/db/maintenance";

// Scheduled cleanup of expired anonymous sessions and their data. Invoked by
// Vercel Cron (see vercel.json). Vercel automatically sends the CRON_SECRET as
// a Bearer token, which we require so the endpoint can't be triggered publicly.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const deleted = await deleteExpiredSessions();
  return NextResponse.json({ deleted });
}

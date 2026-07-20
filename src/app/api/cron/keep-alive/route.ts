import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runKeepAlive } from "@/db/maintenance";

// Daily keep-alive that generates a little write traffic so Supabase doesn't
// pause the project for inactivity. Invoked by Vercel Cron (see vercel.json).
// Vercel automatically sends the CRON_SECRET as a Bearer token, which we require
// so the endpoint can't be triggered publicly.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const touched = await runKeepAlive();
  return NextResponse.json({ touched });
}

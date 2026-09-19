import { NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seo-audit";

/** Vercel cron, daily 02:00 WIB (19:00 UTC); Vercel sends the CRON_SECRET as a bearer token. */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runSeoAudit();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}

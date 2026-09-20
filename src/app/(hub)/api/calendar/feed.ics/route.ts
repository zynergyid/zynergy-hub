import { getCalendarItems, getUserByCalendarToken } from "@/lib/calendar";
import { buildIcs } from "@/lib/ics";

/**
 * Personal read-only calendar feed for Google Calendar or the phone's
 * calendar app: /api/calendar/feed.ics?t=<token from Profil>. The token is
 * the only credential, so it can be rotated from the profile page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getUserByCalendarToken(url.searchParams.get("t") ?? "");
  if (!user) return new Response("Tautan kalender tidak dikenal.", { status: 401 });
  const from = new Date(Date.now() - 30 * 86400000);
  const to = new Date(Date.now() + 180 * 86400000);
  const items = await getCalendarItems({ from, to, user });
  const body = buildIcs(items, { name: "Zynergy Hub", baseUrl: `${url.protocol}//${url.host}` });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="zynergy-hub.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
}

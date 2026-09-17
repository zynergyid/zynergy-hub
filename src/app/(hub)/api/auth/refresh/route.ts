import { NextResponse, type NextRequest } from "next/server";
import { createLocalReq, refreshOperation } from "payload";
import { getPayloadClient } from "@/lib/payload";
import { REFRESH_AFTER_SECONDS, REMEMBER_COOKIE, SESSION_MAX_AGE_SECONDS, cookieBase, tokenAgeSeconds } from "@/lib/auth-cookie";

/**
 * Sliding renewal for remembered devices: called once per visit by the app
 * shell. Reissues the token (and extends the server-side session) when the
 * current one is older than a day; otherwise does nothing.
 */
export async function POST(req: NextRequest) {
  if (!req.cookies.get(REMEMBER_COOKIE)?.value) return new NextResponse(null, { status: 204 });
  const payload = await getPayloadClient();
  const tokenName = `${payload.config.cookiePrefix}-token`;
  const token = req.cookies.get(tokenName)?.value;
  if (!token) return new NextResponse(null, { status: 401 });
  const age = tokenAgeSeconds(token);
  if (age !== null && age < REFRESH_AFTER_SECONDS) return new NextResponse(null, { status: 204 });

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return new NextResponse(null, { status: 401 });
  try {
    const localReq = await createLocalReq({ user, req: { headers: req.headers } }, payload);
    const { refreshedToken } = await refreshOperation({ collection: payload.collections.users, req: localReq });
    const res = new NextResponse(null, { status: 200 });
    res.cookies.set({ ...cookieBase, name: tokenName, value: refreshedToken, maxAge: SESSION_MAX_AGE_SECONDS });
    res.cookies.set({ ...cookieBase, httpOnly: false, name: REMEMBER_COOKIE, value: "1", maxAge: SESSION_MAX_AGE_SECONDS });
    return res;
  } catch (error) {
    console.error("refresh failed:", error);
    return new NextResponse(null, { status: 500 });
  }
}

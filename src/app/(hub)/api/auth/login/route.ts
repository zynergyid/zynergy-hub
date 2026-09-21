import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { REMEMBER_COOKIE, SESSION_MAX_AGE_SECONDS, SHORT_SESSION_SECONDS, cookieBase } from "@/lib/auth-cookie";
import { logActivity } from "@/lib/audit";

/**
 * Login that honours "Ingat saya". Payload's own /api/users/login always sets
 * the cookie for the full token lifetime; here a remembered device gets 90
 * days (renewed on use by /api/auth/refresh) and any other device 4 hours.
 * Wrong passwords and lockouts (5 tries, 10 minutes) are Payload's rules.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown; remember?: unknown };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const remember = body.remember !== false;
  if (!email || !password) return NextResponse.json({ message: "Isi email dan password." }, { status: 400 });

  const payload = await getPayloadClient();
  try {
    const { token, user } = await payload.login({ collection: "users", data: { email, password } });
    if (!token || !user) return NextResponse.json({ message: "Login gagal. Coba lagi." }, { status: 500 });
    const now = new Date().toISOString();
    await payload.update({ collection: "users", id: user.id, data: { lastLoginAt: now, lastSeenAt: now }, context: { skipAudit: true } }).catch(() => undefined);
    await logActivity(payload, { action: "login", collection: "users", docId: user.id, title: user.name, summary: remember ? "perangkat diingat 90 hari" : "sesi 4 jam", actor: { id: user.id, name: user.name } });
    const res = NextResponse.json({ ok: true });
    const maxAge = remember ? SESSION_MAX_AGE_SECONDS : SHORT_SESSION_SECONDS;
    res.cookies.set({ ...cookieBase, name: `${payload.config.cookiePrefix}-token`, value: token, maxAge });
    if (remember) res.cookies.set({ ...cookieBase, httpOnly: false, name: REMEMBER_COOKIE, value: "1", maxAge });
    else res.cookies.set({ ...cookieBase, httpOnly: false, name: REMEMBER_COOKIE, value: "", maxAge: 0 });
    return res;
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const text = error instanceof Error ? error.message : "";
    if (status === 401 && /locked/i.test(text)) {
      return NextResponse.json({ message: "Akun terkunci sementara karena terlalu banyak percobaan. Coba lagi 10 menit." }, { status: 401 });
    }
    if (status === 401) return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
    console.error("login failed:", error);
    return NextResponse.json({ message: "Login gagal. Coba lagi." }, { status: 500 });
  }
}

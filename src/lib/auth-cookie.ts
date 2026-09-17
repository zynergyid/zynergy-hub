/**
 * Login lifetimes. "Ingat saya" gives a long cookie that the app renews on
 * use (sliding), so an active person never logs in again while a lost or
 * abandoned device expires on its own. Without it the login ends after a
 * working half-day.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
export const SHORT_SESSION_SECONDS = 60 * 60 * 4;
/** A remembered token older than this is reissued on the next visit. */
export const REFRESH_AFTER_SECONDS = 60 * 60 * 24;
/** Marker cookie (readable by the browser) that says this device chose "Ingat saya". */
export const REMEMBER_COOKIE = "hub-remember";

export const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Seconds since the JWT was issued, or null when it cannot be read. Verification happens elsewhere. */
export function tokenAgeSeconds(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { iat?: number };
    return typeof payload.iat === "number" ? Math.floor(Date.now() / 1000) - payload.iat : null;
  } catch {
    return null;
  }
}

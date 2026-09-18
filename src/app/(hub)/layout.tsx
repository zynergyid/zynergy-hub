import type { Metadata, Viewport } from "next";
import { getSessionUser } from "@/lib/session";
import { Sidebar } from "@/components/hub/Sidebar";
import { MobileTabs } from "@/components/hub/MobileTabs";
import { SessionKeepAlive } from "@/components/hub/SessionKeepAlive";
import { OverflowGuard } from "@/components/hub/OverflowGuard";
import { BrandMark } from "@/components/ui/BrandMark";
import Link from "next/link";
import { LogoutButton } from "@/components/hub/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Zynergy Hub", template: "%s | Zynergy Hub" },
  description: "Aplikasi internal tim Zynergy: klien, arus kas, alat kerja.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Zynergy Hub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0B1B3F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function HubLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  return (
    <html lang="id">
      <body className="min-h-screen bg-surface text-ink antialiased">
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar role={user.role} units={user.units} userName={user.name} />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-line bg-white px-4 md:hidden">
                <BrandMark className="size-7 text-navy" />
                <span className="flex-1 text-base font-extrabold tracking-tight">
                  Zynergy <span className="text-muted">Hub</span>
                </span>
                <Link href="/profile" className="rounded-lg p-2 text-muted hover:bg-surface-soft hover:text-ink" aria-label="Profil">
                  <span className="grid size-6 place-items-center rounded-full bg-primary-soft text-[10px] font-extrabold text-primary-dark">{user.name.slice(0, 1).toUpperCase()}</span>
                </Link>
                <LogoutButton />
              </header>
              {/* overflow-x-clip: nothing a page renders can widen the phone screen; see HANDOFF "Layar HP". */}
              <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-8">
                {children}
              </main>
            </div>
            <MobileTabs role={user.role} units={user.units} />
            <SessionKeepAlive />
            {process.env.NODE_ENV !== "production" && <OverflowGuard />}
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}

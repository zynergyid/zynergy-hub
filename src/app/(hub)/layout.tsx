import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Zynergy Hub", template: "%s | Zynergy Hub" },
  description: "Aplikasi internal tim Zynergy: klien, keuangan, operasional.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Zynergy Hub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0B1B3F",
  width: "device-width",
  initialScale: 1,
};

export default function HubLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-surface text-ink antialiased">
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2" aria-label="Zynergy Hub">
              <BrandMark className="size-7 text-navy" />
              <span className="whitespace-nowrap text-base font-extrabold tracking-tight">
                Zynergy <span className="text-muted">Hub</span>
              </span>
            </Link>
            <nav className="flex items-center gap-3 text-xs font-medium text-muted sm:gap-4 sm:text-sm">
              <Link href="/admin/collections/clients" className="hover:text-primary">Klien</Link>
              <Link href="/admin/collections/transactions" className="hover:text-primary">Transaksi</Link>
              <Link href="/admin" className="hover:text-primary">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}

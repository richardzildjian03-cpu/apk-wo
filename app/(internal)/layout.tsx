import { requireInternal } from "@/lib/auth";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { getSetting } from "@/lib/settings";
import { logoutAction } from "@/lib/actions/auth";
import { NavLinks, type NavItem } from "@/components/nav-links";
import Link from "next/link";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireInternal();

  const [siteName, siteTagline, logoPath] = await Promise.all([
    getSetting("site_name", "DekorLamaran"),
    getSetting("site_tagline", "Wedding Organizer Management"),
    getSetting("logo_path"),
  ]);

  const navItems: NavItem[] = [{ href: "/dashboard", label: "Dashboard" }];

  if (session.role !== ROLES.LEADER) {
    navItems.push(
      { href: "/events", label: "Event" },
      { href: "/packages", label: "Paket" },
      { href: "/users", label: "Pengguna" },
    );
  } else {
    navItems.push({ href: "/events", label: "Event Saya" });
  }

  navItems.push(
    { href: "/vendors", label: "Vendor" },
    { href: "/reports", label: "Laporan" },
  );

  if (session.role !== ROLES.LEADER) {
    navItems.push({ href: "/settings", label: "Pengaturan" });
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Strip aksen hijau solid di tepi atas */}
      <div className="no-print fixed inset-x-0 top-0 z-20 h-1.5 bg-emerald-500" />

      <aside className="no-print hidden w-64 shrink-0 flex-col sidebar-brand shadow-xl md:flex">
        <div className="border-b border-white/20 px-5 py-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            {logoPath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoPath} alt={siteName} className="h-10 w-10 rounded-lg object-contain" />
            ) : null}
            <div>
              <p className="inv-script text-2xl text-emerald-300">{siteName}</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-emerald-200 uppercase">
                Internal Panel
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLinks items={navItems} dark />
        </nav>
        <div className="border-t border-white/20 p-3">
          <div className="mb-3 rounded-lg bg-white/10 px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-white">{session.nama}</p>
            <p className="text-xs text-emerald-200">{ROLE_LABELS[session.role]}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg px-4 py-2 text-left text-sm font-medium text-white/80 transition hover:bg-red-500/80 hover:text-white"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print mt-1 flex items-center justify-between gap-4 border-b border-pink-100 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              {logoPath ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoPath} alt={siteName} className="h-7 w-7 rounded-md object-contain" />
              ) : (
                <span className="inv-script rounded-lg bg-emerald-600 px-2.5 py-1 text-lg text-white shadow-md">
                  DL
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{session.nama}</p>
              <p className="text-xs text-pink-600">{ROLE_LABELS[session.role]}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary md:hidden">
              Keluar
            </button>
          </form>
          {session.role !== ROLES.LEADER ? (
            <Link href="/events" className="btn-primary hidden md:inline-flex">
              + Event Baru
            </Link>
          ) : null}
        </header>

        <nav className="no-print mt-1 flex gap-1 overflow-x-auto sidebar-brand px-3 py-2 md:hidden">
          <NavLinks items={navItems} orientation="horizontal" dark />
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
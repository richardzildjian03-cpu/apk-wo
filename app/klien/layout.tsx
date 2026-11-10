import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { getSetting } from "@/lib/settings";
import { logoutAction } from "@/lib/actions/auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function KlienLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(ROLES.KLIEN);

  const [siteName, logoPath] = await Promise.all([
    getSetting("site_name", "DekorLamaran"),
    getSetting("logo_path"),
  ]);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 sidebar-brand shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo
              siteName={siteName}
              logoPath={logoPath}
              subtitle="Portal Pengantin"
              href="/klien"
              size="sm"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden max-w-[16rem] truncate text-xs font-medium text-white/90 sm:block">
              {session.nama}
            </p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="cursor-pointer rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { getSetting } from "@/lib/settings";
import { logoutAction } from "@/lib/actions/auth";

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {logoPath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoPath} alt={siteName} className="h-8 w-8 rounded-md object-contain" />
            ) : null}
            <p className="inv-script text-2xl text-emerald-300">{siteName}</p>
            <span className="hidden rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-emerald-200 uppercase sm:inline">
              Portal Pengantin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs font-medium text-white/90 sm:block">{session.nama}</p>
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
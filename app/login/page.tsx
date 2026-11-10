import { redirect } from "next/navigation";
import { getSession, homePathFor } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { loginAction } from "@/lib/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homePathFor(session.role));

  const [siteName, siteTagline, logoPath] = await Promise.all([
    getSetting("site_name", "DekorLamaran"),
    getSetting("site_tagline", "Wedding Organizer Management"),
    getSetting("logo_path"),
  ]);

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-pink-100 via-white to-emerald-100 px-4 py-10">
      <div className="fade-in w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-pink-200 shadow-xl shadow-pink-200/50">
          <div className="sidebar-brand flex flex-col items-center gap-4 px-6 py-8 text-center">
            <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-white/40">
              {logoPath ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoPath} alt={siteName} className="h-full w-full object-contain p-1.5" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-pink-500 to-pink-600 text-2xl font-bold text-white">
                  {(siteName || "DL")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </span>
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white">{siteName}</p>
              {siteTagline ? (
                <p className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-emerald-200 uppercase">
                  {siteTagline}
                </p>
              ) : null}
            </div>
          </div>
          <div className="bg-white px-6 py-8">
            <p className="mb-6 text-center text-sm text-zinc-500">
              Masuk untuk mengelola jadwal, vendor, tamu, dan undangan digital
            </p>

            <ActionForm action={loginAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="nama@wo.id"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <SubmitButton className="w-full">Masuk</SubmitButton>
            </ActionForm>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-400">
          &copy; {new Date().getFullYear()} {siteName}. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </main>
  );
}
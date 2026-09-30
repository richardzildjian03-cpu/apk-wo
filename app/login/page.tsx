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
          <div className="sidebar-brand flex flex-col items-center gap-3 px-6 py-8 text-center">
            {logoPath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoPath}
                alt={siteName}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : null}
            <div>
              <p className="inv-script text-4xl text-emerald-300">{siteName}</p>
              {siteTagline ? (
                <p className="mt-2 text-xs font-semibold tracking-[0.25em] text-emerald-200 uppercase">
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

        <div className="card mt-4">
          <div className="card-body text-xs text-zinc-500">
            <p className="mb-2 font-semibold text-zinc-600">Akun demo (password: password123)</p>
            <ul className="grid gap-1">
              <li>
                <span className="font-medium text-zinc-700">Bos</span> — bos@wo.id
              </li>
              <li>
                <span className="font-medium text-zinc-700">Leader WO</span> — leader@wo.id
              </li>
              <li>
                <span className="font-medium text-zinc-700">Staff Admin</span> — staff@wo.id
              </li>
              <li>
                <span className="font-medium text-zinc-700">Klien (Pengantin)</span> — klien@wo.id
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
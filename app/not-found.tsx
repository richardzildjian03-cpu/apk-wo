import Link from "next/link";

export const metadata = { title: "Halaman Tidak Ditemukan" };

export default function NotFound() {
  return (
    <main className="inv-hero flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="fade-in w-full max-w-md text-center">
        <div className="card overflow-hidden shadow-xl shadow-pink-200/40">
          <div className="sidebar-brand px-6 py-8">
            <p className="text-5xl font-bold text-white/90">404</p>
            <p className="inv-script mt-2 text-2xl text-emerald-300">Halaman tidak ditemukan</p>
          </div>
          <div className="bg-white px-6 py-8">
            <p className="text-sm text-zinc-500">
              Halaman yang Anda cari sudah tidak ada, telah dihapus, atau alamatnya salah.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="btn-primary">
                Ke Dashboard
              </Link>
              <Link href="/events" className="btn-secondary">
                Daftar Event
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-zinc-400">
          Bila Anda tamu undangan, pastikan tautan yang dibagikan sudah benar.
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function KlienNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-md overflow-hidden text-center shadow-xl shadow-pink-200/30">
        <div className="sidebar-brand px-6 py-8">
          <p className="text-4xl font-bold text-white/90">404</p>
          <p className="mt-2 text-sm font-semibold text-emerald-200">
            Acara tidak ditemukan
          </p>
        </div>
        <div className="card-body">
          <p className="text-sm text-zinc-500">
            Acara yang Anda buka sudah tidak tersedia atau sudah dihapus oleh tim
            WO. Silakan kembali ke daftar acara Anda.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/klien" className="btn-primary">
              Acara Saya
            </Link>
            <Link href="/login" className="btn-secondary">
              Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

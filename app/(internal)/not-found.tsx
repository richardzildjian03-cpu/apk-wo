import Link from "next/link";

export default function InternalNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-md text-center">
        <div className="card-header-green">
          <p className="text-3xl font-bold text-white">404</p>
          <p className="mt-1 text-sm font-semibold text-emerald-100">Data tidak ditemukan</p>
        </div>
        <div className="card-body">
          <p className="text-sm text-zinc-500">
            Data yang Anda buka sudah dihapus, dipindahkan, atau tidak ada.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/events" className="btn-primary">
              Daftar Event
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

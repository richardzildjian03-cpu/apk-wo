import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES, KATEGORI_LABELS, formatTanggal } from "@/lib/constants";
import { revertCheckInAction } from "@/lib/actions/checkin";
import { CheckinScanner } from "@/components/checkin-scanner";
import { ActionForm, ConfirmSubmit } from "@/components/forms";
import { PageHeader, Card, StatCard, TamuStatusBadge, EmptyState } from "@/components/ui";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Check-in Tamu" };

export default async function CheckinPage({ params }: Props) {
  const session = await requireInternal();
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) notFound();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tamu: {
        include: { rsvp: true, checkIn: { include: { petugas: true } } },
        orderBy: { nama: "asc" },
      },
      walkIns: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!event) notFound();
  if (session.role === ROLES.LEADER && event.leaderId !== session.id) notFound();

  const modeQr = event.modeQr || "PER_TAMU";
  const tamuList = event.tamu;
  const checkedInList = tamuList
    .filter((t) => t.checkIn)
    .sort((a, b) => (b.checkIn!.waktuCheckIn > a.checkIn!.waktuCheckIn ? 1 : -1));
  const checkedInCount = checkedInList.length;
  const vipCheckedIn = checkedInList.filter((t) => t.status === "VIP").length;
  const rsvpHadirCount = tamuList.filter((t) => t.rsvp?.status === "HADIR").length;
  const walkInCount = event.walkIns.reduce((s, w) => s + w.jumlah, 0);

  return (
    <div>
      <PageHeader
        title="Check-in Tamu"
        description={`${event.namaAcara} • ${formatTanggal(event.tanggal)} • ${event.lokasi}`}
      >
        <Link href={`/events/${event.id}`} className="btn-secondary">
          &larr; Detail Event
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Tamu" value={tamuList.length} variant="zinc" />
        <StatCard label="RSVP Hadir" value={rsvpHadirCount} hint="Konfirmasi sebelum acara" variant="violet" />
        <StatCard label="Sudah Check-in" value={checkedInCount} hint="Tamu tercatat datang" variant="green" />
        <StatCard label="VIP Check-in" value={vipCheckedIn} variant="pink" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {modeQr === "SATU_QR" ? (
          <div className="card">
            <div className="card-header-green flex flex-wrap items-center justify-between gap-2">
              <h2 className="card-title-white">QR Master Acara</h2>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                {checkedInCount}/{tamuList.length} tamu sudah check-in
              </span>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-zinc-600">
                Tamu scan QR ini dengan kamera HP masing-masing, lalu menulis namanya sendiri.
                Tugas Anda cukup menampilkan QR ini — tidak perlu membuka kamera.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="shrink-0 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr-acara/${event.eventToken}?ukuran=480`}
                    alt="QR master check-in acara"
                    width={180}
                    height={180}
                    className="h-44 w-44 object-contain"
                  />
                </div>
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2.5">
                      <p className="text-[11px] text-zinc-500">Total</p>
                      <p className="text-lg font-semibold text-zinc-900">{tamuList.length}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-700 bg-emerald-600 px-2 py-2.5">
                      <p className="text-[11px] text-emerald-100">Hadir</p>
                      <p className="text-lg font-bold text-white">{checkedInCount}</p>
                    </div>
                    <div className="rounded-lg border border-pink-300 bg-pink-100 px-2 py-2.5">
                      <p className="text-[11px] text-pink-700">Belum</p>
                      <p className="text-lg font-semibold text-pink-800">
                        {tamuList.length - checkedInCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/qr-acara/${event.eventToken}?ukuran=1024&unduh=1`}
                      className="btn-secondary !text-xs"
                    >
                      Unduh QR (PNG)
                    </a>
                    <a
                      href={`/api/qr-acara/${event.eventToken}?ukuran=1024`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary !text-xs"
                    >
                      Buka QR Besar
                    </a>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Cetak minimal 5×5 cm dan tempel di meja penerimaan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CheckinScanner
            eventId={event.id}
            totalTamu={tamuList.length}
            initialCheckedIn={checkedInCount}
          />
        )}
        <div className="card flex flex-col">
          <div className="card-header-green flex items-center justify-between gap-2">
            <h2 className="card-title-white">Log Check-in</h2>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
              {checkedInCount} tamu
            </span>
          </div>
          <div className="card-body flex-1">
          {checkedInList.length === 0 ? (
            <EmptyState message="Belum ada tamu yang check-in. Scan QR untuk memulai." />
          ) : (
            <div className="-m-4 max-h-[28rem] overflow-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Nama</th>
                    <th className="hidden md:table-cell">Status</th>
                    <th className="hidden lg:table-cell">Sumber Check-in</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {checkedInList.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap">
                        <span className="badge badge-green font-mono text-xs">
                          {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(t.checkIn!.waktuCheckIn)}
                        </span>
                      </td>
                      <td className="font-medium text-zinc-900">
                        {t.nama}
                        <p className="text-xs font-normal text-zinc-400">
                          {KATEGORI_LABELS[t.kategori] ?? t.kategori}
                        </p>
                      </td>
                      <td className="hidden md:table-cell">
                        <TamuStatusBadge status={t.status} />
                      </td>
                      <td className="hidden lg:table-cell">
                        {t.checkIn!.sumber === "MANDIRI" ? (
                          <span className="badge badge-amber">Mandiri</span>
                        ) : (
                          (t.checkIn!.petugas?.nama ?? "Petugas")
                        )}
                      </td>
                      <td>
                        <ActionForm action={revertCheckInAction}>
                          <input type="hidden" name="id" value={t.checkIn!.id} />
                          <ConfirmSubmit
                            message={`Batalkan check-in ${t.nama}? Tamu dapat check-in ulang.`}
                          >
                            Batalkan
                          </ConfirmSubmit>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Info mode QR yang sedang aktif */}
      <div className="mt-6">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-sm ${
            modeQr === "SATU_QR"
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-pink-200 bg-pink-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${
                modeQr === "SATU_QR" ? "bg-emerald-600" : "bg-pink-600"
              }`}
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Mode QR Aktif</p>
              <p className="text-sm font-semibold text-zinc-900">
                {modeQr === "SATU_QR"
                  ? "1 QR untuk Semua Tamu — tamu scan sendiri"
                  : "1 Tamu 1 QR — petugas scan QR tamu"}
              </p>
            </div>
          </div>
          <Link href={`/events/${event.id}?tab=rekap`} className="btn-secondary !text-xs shrink-0">
            Lihat Rekap
          </Link>
        </div>
      </div>

      {/* Daftar walk-in (hanya tampil bila ada) */}
      {event.walkIns.length > 0 ? (
        <div className="mt-6">
          <Card
            title={`Tamu Tambahan / Walk-in (${event.walkIns.length} isian • ${walkInCount} orang)`}
          >
            <p className="mb-3 text-xs text-zinc-500">
              Tamu yang melakukan check-in mandiri namun namanya tidak ada di daftar undangan.
            </p>
            <div className="-m-4 overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Nama</th>
                    <th>Jumlah</th>
                    <th className="hidden md:table-cell">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {event.walkIns.map((w) => (
                    <tr key={w.id}>
                      <td className="whitespace-nowrap font-mono text-xs">
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(w.createdAt)}
                      </td>
                      <td className="font-medium text-zinc-900">{w.nama}</td>
                      <td>{w.jumlah} orang</td>
                      <td className="hidden md:table-cell">{w.keterangan ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      <Card title="Cara Penggunaan">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600">
          {modeQr === "SATU_QR" ? (
            <>
              <li>
                Cetak QR master dari halaman detail event (tab Tamu) atau tekan &quot;Buka QR
                Master&quot; di atas, lalu tempel di meja penerimaan.
              </li>
              <li>
                Tamu scan QR tersebut dengan kamera HP masing-masing — iPhone (Safari) dan Android
                (Chrome) sama-sama didukung.
              </li>
              <li>
                Tamu menulis namanya di halaman check-in; bila namanya terdaftar, sistem langsung
                mencocokkan dan menandai hadir.
              </li>
              <li>
                Tamu yang tidak ada di daftar tetap bisa konfirmasi — tercatat sebagai tamu tambahan
                dan muncul di tabel Walk-in di atas.
              </li>
              <li>
                Pantau jumlah kehadiran lewat counter dan log di halaman ini, atau lewat tab Rekap
                Kehadiran.
              </li>
            </>
          ) : (
            <>
              <li>
                Buka halaman ini di HP petugas (Leader/Staff) pada hari acara — login dengan akun
                internal WO.
              </li>
              <li>Tekan &quot;Mulai Scan&quot;, arahkan kamera ke QR pada undangan digital tamu.</li>
              <li>
                Sistem menampilkan nama tamu, status VIP/Regular, jumlah kursi, dan RSVP — tandai
                check-in otomatis (anti check-in ganda).
              </li>
              <li>
                Jika kamera tidak tersedia, gunakan input manual: tempel tautan undangan
                (/undangan/...) atau token QR tamu.
              </li>
              <li>
                Salah scan? Batalkan lewat tombol &quot;Batalkan&quot; pada log — tamu dapat
                check-in ulang.
              </li>
            </>
          )}
        </ol>
        <p className="mt-3 text-xs text-zinc-400">
          Catatan: kamera hanya aktif pada konteks aman — HTTPS (produksi) atau localhost
          (development). Membuka dari HP via alamat IP (cth. http://192.168.x.x:3000) diblokir
          browser; gunakan tunnel HTTPS (cth. <code>npx localtunnel --port 3000</code>) atau input
          manual.
        </p>
      </Card>
    </div>
  );
}

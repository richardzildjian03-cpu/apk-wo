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
        <CheckinScanner
          eventId={event.id}
          totalTamu={tamuList.length}
          initialCheckedIn={checkedInCount}
        />

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
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div
          className={`rounded-xl border p-4 shadow-sm lg:col-span-3 ${
            modeQr === "SATU_QR"
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-pink-200 bg-pink-50/60"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide uppercase text-zinc-500">
                Mode QR Aktif
              </p>
              <p className="mt-0.5 font-semibold text-zinc-900">
                {modeQr === "SATU_QR"
                  ? "1 QR untuk Semua Tamu (tamu check-in mandiri)"
                  : "1 Tamu 1 QR (petugas scan QR tamu)"}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {modeQr === "SATU_QR"
                  ? "Tamu scan QR master di lokasi lalu mengisi nama sendiri. Counter di bawah mencakup check-in mandiri."
                  : "Petugas scan QR pribadi tamu memakai kamera di bawah, atau input manual token."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href={`/events/${event.id}?tab=rekap`} className="btn-secondary !text-xs">
                Lihat Rekap
              </Link>
              {modeQr === "SATU_QR" ? (
                <a
                  href={`/api/qr-acara/${event.eventToken}?ukuran=1024`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !text-xs"
                >
                  Buka QR Master
                </a>
              ) : null}
            </div>
          </div>
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

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
    },
  });
  if (!event) notFound();
  if (session.role === ROLES.LEADER && event.leaderId !== session.id) notFound();

  const tamuList = event.tamu;
  const checkedInList = tamuList
    .filter((t) => t.checkIn)
    .sort((a, b) => (b.checkIn!.waktuCheckIn > a.checkIn!.waktuCheckIn ? 1 : -1));
  const checkedInCount = checkedInList.length;
  const vipCheckedIn = checkedInList.filter((t) => t.status === "VIP").length;
  const rsvpHadirCount = tamuList.filter((t) => t.rsvp?.status === "HADIR").length;

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
                    <th className="hidden lg:table-cell">Petugas</th>
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
                      <td className="hidden lg:table-cell">{t.checkIn!.petugas.nama}</td>
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

      <Card title="Cara Penggunaan">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600">
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
            Salah scan? Batalkan lewat tombol &quot;Batalkan&quot; pada log — tamu dapat check-in
            ulang.
          </li>
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

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, KATEGORI_LABELS } from "@/lib/constants";
import { PrintButton } from "@/components/forms";
import { Card, StatCard, EmptyState, RsvpBadge, TamuStatusBadge } from "@/components/ui";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const metadata = { title: "Rekap Kehadiran" };

export default async function KlienRekapPage({ params }: Props) {
  const session = await requireRole(ROLES.KLIEN);
  const { eventId } = await params;
  const id = Number(eventId);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tamu: { include: { rsvp: true, checkIn: true }, orderBy: { nama: "asc" } },
      walkIns: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!event || event.klienId !== session.id) notFound();

  const tamuList = event.tamu;
  const hadir = tamuList.filter((t) => t.rsvp?.status === "HADIR");
  const tidak = tamuList.filter((t) => t.rsvp?.status === "TIDAK");
  const kosong = tamuList.filter((t) => !t.rsvp);
  const vipHadir = hadir.filter((t) => t.status === "VIP");
  const totalOrangHadir = hadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0);
  const checkedInList = tamuList.filter((t) => t.checkIn);
  const checkInMandiri = checkedInList.filter((t) => t.checkIn!.sumber === "MANDIRI").length;
  const walkInOrang = event.walkIns.reduce((s, w) => s + w.jumlah, 0);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="inv-serif text-xl font-semibold text-zinc-900">Rekap Kehadiran Tamu</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Berdasarkan konfirmasi (RSVP) dari undangan digital — diperbarui otomatis.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/${event.id}`} className="btn-primary">
            Unduh Excel (CSV)
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="hidden print:block">
        <h2 className="inv-serif text-xl font-semibold">Rekap Kehadiran — {event.namaAcara}</h2>
        <p className="text-sm text-zinc-600">Dicetak: {new Date().toLocaleString("id-ID")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Tamu" value={tamuList.length} variant="zinc" />
        <StatCard label="Hadir" value={hadir.length} hint={`${totalOrangHadir} orang`} variant="green" />
        <StatCard label="Tidak Hadir" value={tidak.length} variant="pink" />
        <StatCard label="Belum Menjawab" value={kosong.length} variant="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          label="Sudah Check-in di Lokasi"
          value={checkedInList.length}
          hint={
            checkInMandiri > 0
              ? `${checkInMandiri} mandiri, ${checkedInList.length - checkInMandiri} oleh petugas`
              : "Dicatat petugas saat tamu tiba"
          }
          variant="green"
        />
        <StatCard
          label="Tamu Tambahan (Walk-in)"
          value={event.walkIns.length}
          hint={walkInOrang > 0 ? `${walkInOrang} orang` : "Tidak ada tamu di luar daftar"}
          variant="violet"
        />
      </div>

      <Card title={`VIP Hadir: ${vipHadir.length} tamu`}>
        <p className="mb-4 text-sm text-zinc-500">
          Tamu VIP (keluarga inti / sesepuh / pejabat) yang telah konfirmasi hadir.
        </p>
        {vipHadir.length === 0 ? (
          <EmptyState message="Belum ada tamu VIP yang konfirmasi hadir." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {vipHadir.map((t) => (
              <span key={t.id} className="badge badge-violet">
                {t.nama} ({t.rsvp?.jumlahHadir ?? 0} org)
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title="Rincian per Tamu">
        {tamuList.length === 0 ? (
          <EmptyState message="Belum ada tamu terdaftar." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th className="hidden md:table-cell">Kategori</th>
                  <th>Status</th>
                  <th>Konfirmasi</th>
                  <th>Jumlah Hadir</th>
                  <th className="hidden md:table-cell">Check-in</th>
                  <th className="hidden md:table-cell">Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {tamuList.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium text-zinc-900">{t.nama}</td>
                    <td className="hidden md:table-cell">{KATEGORI_LABELS[t.kategori] ?? t.kategori}</td>
                    <td>
                      <TamuStatusBadge status={t.status} />
                    </td>
                    <td>
                      <RsvpBadge status={t.rsvp?.status ?? null} />
                    </td>
                    <td>{t.rsvp?.status === "HADIR" ? t.rsvp.jumlahHadir : "-"}</td>
                    <td className="hidden md:table-cell">
                      {t.checkIn ? (
                        <span className="badge badge-green">
                          {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(t.checkIn.waktuCheckIn)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {t.rsvp
                        ? new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(t.rsvp.updatedAt)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {event.walkIns.length > 0 ? (
        <Card title="Tamu Tambahan / Walk-in">
          <p className="mb-3 text-xs text-zinc-500">
            Tamu yang check-in mandiri melalui QR acara namun tidak ada di daftar undangan Anda.
          </p>
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Jumlah</th>
                  <th className="hidden md:table-cell">Keterangan</th>
                  <th className="hidden md:table-cell">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {event.walkIns.map((w, i) => (
                  <tr key={w.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium text-zinc-900">{w.nama}</td>
                    <td>{w.jumlah} orang</td>
                    <td className="hidden md:table-cell">{w.keterangan ?? "-"}</td>
                    <td className="hidden md:table-cell">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(w.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

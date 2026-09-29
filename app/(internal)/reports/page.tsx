import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES, formatTanggal } from "@/lib/constants";
import { PageHeader, EventStatusBadge, EmptyState, Badge } from "@/components/ui";

export const metadata = { title: "Laporan Kehadiran" };

export default async function ReportsPage() {
  const session = await requireInternal();
  const isLeader = session.role === ROLES.LEADER;

  const events = await prisma.event.findMany({
    where: isLeader ? { leaderId: session.id } : {},
    orderBy: { tanggal: "desc" },
    include: {
      klien: true,
      tamu: { include: { rsvp: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Laporan Kehadiran Tamu"
        description="Rekap RSVP dan kehadiran tamu per event — dapat diunduh sebagai Excel (CSV)"
      />

      {events.length === 0 ? (
        <EmptyState message="Belum ada event." />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const hadir = event.tamu.filter((t) => t.rsvp?.status === "HADIR");
            const tidak = event.tamu.filter((t) => t.rsvp?.status === "TIDAK");
            const kosong = event.tamu.filter((t) => !t.rsvp);
            const totalOrangHadir = hadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0);

            return (
              <div key={event.id} className="card">
                <div className="card-header flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="card-title">{event.namaAcara}</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatTanggal(event.tanggal)} • {event.lokasi} • Klien: {event.klien.nama}
                    </p>
                  </div>
                  <EventStatusBadge status={event.status} />
                </div>
                <div className="card-body">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="zinc">Total: {event.tamu.length} tamu</Badge>
                    <Badge variant="green">
                      Hadir: {hadir.length} tamu ({totalOrangHadir} orang)
                    </Badge>
                    <Badge variant="red">Tidak: {tidak.length}</Badge>
                    <Badge variant="violet">Belum menjawab: {kosong.length}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/events/${event.id}?tab=rekap`} className="btn-secondary">
                      Lihat Rincian
                    </Link>
                    <a href={`/api/export/${event.id}`} className="btn-primary">
                      Unduh Excel (CSV)
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

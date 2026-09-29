import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES, formatTanggal, formatTanggalWaktu } from "@/lib/constants";
import { PageHeader, StatCard, Card, EventStatusBadge, EmptyState } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireInternal();
  const isLeader = session.role === ROLES.LEADER;

  const where = isLeader ? { leaderId: session.id } : {};
  const tamuWhere = isLeader ? { event: { leaderId: session.id } } : {};
  const rsvpWhere = isLeader ? { tamu: { event: { leaderId: session.id } } } : {};

  const [totalAktif, bulanIni, totalTamu, rsvpHadir, upcoming] = await Promise.all([
    prisma.event.count({ where: { ...where, status: "AKTIF" } }),
    prisma.event.count({
      where: {
        ...where,
        status: { in: ["AKTIF", "SELESAI"] },
        tanggal: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    }),
    prisma.tamu.count({ where: tamuWhere }),
    prisma.rsvp.count({ where: { ...rsvpWhere, status: "HADIR" } }),
    prisma.event.findMany({
      where: { ...where, status: "AKTIF" },
      orderBy: { tanggal: "asc" },
      take: 6,
      include: {
        klien: true,
        leader: true,
        _count: { select: { tamu: true, vendors: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${session.nama.split(" ")[0]}`}
        description={
          isLeader
            ? "Ringkasan event yang Anda ampu sebagai Leader WO"
            : "Ringkasan seluruh operasional DekorLamaran"
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Event Aktif" value={totalAktif} hint="Siap & sedang berjalan" variant="pink" />
        <StatCard label="Event Bulan Ini" value={bulanIni} hint="Berlangsung bulan ini" variant="violet" />
        <StatCard label="Total Tamu" value={totalTamu} hint="Seluruh event terkait" variant="zinc" />
        <StatCard label="Konfirmasi Hadir" value={rsvpHadir} hint="RSVP status hadir" variant="green" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Event Mendatang">
            {upcoming.length === 0 ? (
              <EmptyState message="Belum ada event aktif." />
            ) : (
              <div className="-m-4 overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Acara</th>
                      <th>Tanggal</th>
                      <th className="hidden md:table-cell">Klien</th>
                      <th className="hidden lg:table-cell">Tamu</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((event) => (
                      <tr key={event.id}>
                        <td className="font-medium text-zinc-900">{event.namaAcara}</td>
                        <td>{formatTanggal(event.tanggal)}</td>
                        <td className="hidden md:table-cell">{event.klien.nama}</td>
                        <td className="hidden lg:table-cell">{event._count.tamu}</td>
                        <td>
                          <EventStatusBadge status={event.status} />
                        </td>
                        <td>
                          <Link href={`/events/${event.id}`} className="btn-link">
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card title="Pintasan">
          <div className="space-y-2">
            <Link href="/events" className="btn-secondary w-full">
              Kelola Event & Jadwal
            </Link>
            <Link href="/vendors" className="btn-secondary w-full">
              Kelola Vendor
            </Link>
            <Link href="/reports" className="btn-secondary w-full">
              Laporan Kehadiran Tamu
            </Link>
            {!isLeader ? (
              <>
                <Link href="/packages" className="btn-secondary w-full">
                  Kelola Paket
                </Link>
                <Link href="/users" className="btn-secondary w-full">
                  Kelola Pengguna
                </Link>
              </>
            ) : null}
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Terakhir dimuat: {formatTanggalWaktu(new Date())}
      </p>
    </div>
  );
}

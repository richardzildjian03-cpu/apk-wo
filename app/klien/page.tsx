import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, formatTanggal } from "@/lib/constants";
import { EventStatusBadge, PageHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "Acara Saya" };

export default async function KlienHomePage() {
  const session = await requireRole(ROLES.KLIEN);

  const events = await prisma.event.findMany({
    where: { klienId: session.id },
    orderBy: { tanggal: "asc" },
    include: { _count: { select: { tamu: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Acara Saya"
        description={`Selamat datang, ${session.nama}. Pilih acara untuk mengelola data pengantin, keluarga, tamu, dan undangan digital.`}
      />

      {events.length === 0 ? (
        <EmptyState message="Belum ada acara. Tim WO akan membuatkan event dan memberikan akses portal ini." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/klien/${event.id}`}
              className="card block transition hover:border-pink-300 hover:shadow-md"
            >
              <div className="card-header flex items-center justify-between gap-2">
                <h2 className="card-title">{event.namaAcara}</h2>
                <EventStatusBadge status={event.status} />
              </div>
              <div className="card-body">
                <p className="text-sm text-zinc-600">{formatTanggal(event.tanggal)}</p>
                <p className="mt-1 text-sm text-zinc-500">{event.lokasi}</p>
                <p className="mt-3 text-xs text-zinc-400">
                  {event._count.tamu} tamu terdaftar • QR undangan otomatis dibuat
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

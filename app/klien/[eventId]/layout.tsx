import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { NavLinks } from "@/components/nav-links";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
};

export default async function KlienEventLayout({ children, params }: Props) {
  const session = await requireRole(ROLES.KLIEN);
  const { eventId } = await params;
  const id = Number(eventId);
  if (!Number.isFinite(id)) notFound();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.klienId !== session.id) notFound();

  const navItems = [
    { href: `/klien/${event.id}`, label: "Ringkasan" },
    { href: `/klien/${event.id}/keluarga`, label: "Keluarga" },
    { href: `/klien/${event.id}/tamu`, label: "Tamu & QR" },
    { href: `/klien/${event.id}/rekap`, label: "Rekap Hadir" },
  ];

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/klien" className="text-xs text-zinc-400 hover:underline">
            &larr; Semua acara
          </Link>
          <h1 className="inv-serif mt-1 text-2xl font-semibold text-zinc-900">
            {event.namaAcara}
          </h1>
        </div>
      </div>

      <nav className="no-print mb-6 flex gap-1 overflow-x-auto rounded-xl border border-pink-100 bg-white p-1.5 shadow-sm">
        <NavLinks items={navItems} orientation="horizontal" />
      </nav>

      {children}
    </div>
  );
}

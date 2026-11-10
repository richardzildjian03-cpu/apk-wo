import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/constants";
import { getSetting } from "@/lib/settings";
import { SelfCheckinForm } from "@/components/self-checkin-form";

type Props = {
  params: Promise<{ eventToken: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventToken } = await params;
  const event = await prisma.event.findUnique({
    where: { eventToken },
    select: { namaAcara: true },
  });
  if (!event) return { title: "Check-in Tamu" };
  return {
    title: `Check-in — ${event.namaAcara}`,
    description: "Konfirmasi kehadiran tamu",
  };
}

export default async function SelfCheckinPage({ params }: Props) {
  const { eventToken } = await params;

  const event = await prisma.event.findUnique({
    where: { eventToken },
    select: {
      id: true,
      namaAcara: true,
      tanggal: true,
      lokasi: true,
      status: true,
      pengantin: { select: { namaPanggilan: true, namaLengkap: true, pihak: true } },
    },
  });
  if (!event) notFound();

  const [siteName, footerInvitation] = await Promise.all([
    getSetting("site_name", "DekorLamaran"),
    getSetting("footer_invitation", "Undangan digital ini dikelola melalui DekorLamaran"),
  ]);

  if (event.status === "DIBATALKAN") {
    return (
      <main className="inv-hero flex min-h-screen items-center justify-center px-4">
        <div className="card fade-in max-w-md text-center">
          <div className="card-body">
            <p className="inv-serif text-xl font-semibold text-zinc-900">Check-in Ditutup</p>
            <p className="mt-2 text-sm text-zinc-500">
              Mohon maaf, acara ini telah dibatalkan.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const pria = event.pengantin.find((p) => p.pihak === "PRIA");
  const wanita = event.pengantin.find((p) => p.pihak === "WANITA");

  return (
    <main className="inv-hero min-h-screen pb-10">
      <div className="fade-in mx-auto max-w-md px-4 py-8">
        <header className="text-center">
          <p className="text-xs tracking-[0.3em] text-pink-400 uppercase">{siteName}</p>
          <h1 className="inv-serif mt-2 text-2xl font-semibold text-zinc-900">
            {event.namaAcara}
          </h1>
          {wanita || pria ? (
            <p className="mt-1 text-sm text-zinc-500">
              {[wanita?.namaPanggilan ?? wanita?.namaLengkap, pria?.namaPanggilan ?? pria?.namaLengkap]
                .filter(Boolean)
                .join(" & ")}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-400">
            {formatTanggal(event.tanggal)} • {event.lokasi}
          </p>
        </header>

        <div className="mt-6">
          <SelfCheckinForm eventToken={eventToken} namaAcara={event.namaAcara} />
        </div>

        <footer className="mt-8 text-center">
          <p className="inv-script text-xl text-pink-600">Selamat datang</p>
          <p className="mt-1 text-xs text-zinc-400">
            Merupakan kehormatan bagi kami atas kehadiran Anda.
          </p>
          <p className="mt-6 text-[10px] text-zinc-300">{footerInvitation}</p>
        </footer>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, formatTanggal } from "@/lib/constants";
import { savePengantinAction } from "@/lib/actions/guests";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, EventStatusBadge, StatCard } from "@/components/ui";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const metadata = { title: "Ringkasan Acara" };

export default async function KlienOverviewPage({ params }: Props) {
  const session = await requireRole(ROLES.KLIEN);
  const { eventId } = await params;
  const id = Number(eventId);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      paket: true,
      pengantin: true,
      _count: { select: { tamu: true, keluarga: true } },
      tamu: { include: { rsvp: true } },
    },
  });
  if (!event || event.klienId !== session.id) notFound();

  const pria = event.pengantin.find((p) => p.pihak === "PRIA");
  const wanita = event.pengantin.find((p) => p.pihak === "WANITA");

  const rsvpHadir = event.tamu.filter((t) => t.rsvp?.status === "HADIR");
  const totalOrangHadir = rsvpHadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-pink-500 uppercase">Detail Acara</p>
            <h2 className="inv-serif mt-1 text-lg font-semibold text-zinc-900">
              {event.namaAcara}
            </h2>
          </div>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="card-body grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-400 uppercase">Tanggal</p>
            <p className="mt-1 font-medium text-zinc-900">{formatTanggal(event.tanggal)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase">Lokasi</p>
            <p className="mt-1 font-medium text-zinc-900">{event.lokasi}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase">Paket</p>
            <p className="mt-1 font-medium text-zinc-900">{event.paket?.nama ?? "Custom"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Tamu Terdaftar" value={event._count.tamu} hint="QR unik per tamu" variant="pink" />
        <StatCard label="Keluarga" value={event._count.keluarga} hint="Kedua pihak" variant="violet" />
        <StatCard label="Konfirmasi Hadir" value={totalOrangHadir} hint={`${rsvpHadir.length} tamu hadir`} variant="green" />
      </div>

      <Card title="Data Pengantin" >
        <p className="mb-4 text-sm text-zinc-500">
          Data ini ditampilkan pada undangan digital para tamu.
        </p>
        <ActionForm action={savePengantinAction} className="grid gap-6 lg:grid-cols-2">
          <input type="hidden" name="eventId" value={event.id} />

          <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-pink-700">Pengantin Pria</p>
            <div className="space-y-3">
              <div>
                <label className="label">Nama Lengkap</label>
                <input
                  name="priaNamaLengkap"
                  className="input"
                  defaultValue={pria?.namaLengkap ?? ""}
                  placeholder="cth: Dedi Kurniawan, S.Kom"
                  required
                />
              </div>
              <div>
                <label className="label">Nama Panggilan</label>
                <input
                  name="priaNamaPanggilan"
                  className="input"
                  defaultValue={pria?.namaPanggilan ?? ""}
                  placeholder="cth: Dedi"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Anak Ke-</label>
                  <input
                    name="priaAnakKe"
                    type="number"
                    min="1"
                    className="input"
                    defaultValue={pria?.anakKe ?? ""}
                  />
                </div>
                <div>
                  <label className="label">Nama Orang Tua</label>
                  <input
                    name="priaNamaOrtu"
                    className="input"
                    defaultValue={pria?.namaOrtu ?? ""}
                    placeholder="cth: Bpk. Kurniawan & Ibu Siti"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-pink-700">Pengantin Wanita</p>
            <div className="space-y-3">
              <div>
                <label className="label">Nama Lengkap</label>
                <input
                  name="wanitaNamaLengkap"
                  className="input"
                  defaultValue={wanita?.namaLengkap ?? ""}
                  placeholder="cth: Rina Marlina, S.E"
                  required
                />
              </div>
              <div>
                <label className="label">Nama Panggilan</label>
                <input
                  name="wanitaNamaPanggilan"
                  className="input"
                  defaultValue={wanita?.namaPanggilan ?? ""}
                  placeholder="cth: Rina"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Anak Ke-</label>
                  <input
                    name="wanitaAnakKe"
                    type="number"
                    min="1"
                    className="input"
                    defaultValue={wanita?.anakKe ?? ""}
                  />
                </div>
                <div>
                  <label className="label">Nama Orang Tua</label>
                  <input
                    name="wanitaNamaOrtu"
                    className="input"
                    defaultValue={wanita?.namaOrtu ?? ""}
                    placeholder="cth: Bpk. Marlina & Ibu Rahma"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <SubmitButton>Simpan Data Pengantin</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

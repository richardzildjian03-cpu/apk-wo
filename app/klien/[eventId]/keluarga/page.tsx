import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, PIHAK } from "@/lib/constants";
import { addKeluargaAction, deleteKeluargaAction } from "@/lib/actions/guests";
import { ActionForm, SubmitButton, ConfirmSubmit } from "@/components/forms";
import { Card, EmptyState, Badge } from "@/components/ui";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const metadata = { title: "Data Keluarga" };

export default async function KlienKeluargaPage({ params }: Props) {
  const session = await requireRole(ROLES.KLIEN);
  const { eventId } = await params;
  const id = Number(eventId);

  const event = await prisma.event.findUnique({
    where: { id },
    include: { keluarga: { orderBy: [{ pihak: "asc" }, { nama: "asc" }] } },
  });
  if (!event || event.klienId !== session.id) notFound();

  const pria = event.keluarga.filter((k) => k.pihak === "PRIA");
  const wanita = event.keluarga.filter((k) => k.pihak === "WANITA");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="Data Keluarga Kedua Pihak">
          {event.keluarga.length === 0 ? (
            <EmptyState message="Belum ada data keluarga. Tambahkan agar tampil pada undangan digital." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">
                  Pihak Pengantin Pria ({pria.length})
                </p>
                <div className="space-y-2">
                  {pria.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{k.nama}</p>
                        <p className="text-xs text-zinc-500">{k.hubungan}</p>
                      </div>
                      <ActionForm action={deleteKeluargaAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <ConfirmSubmit message={`Hapus ${k.nama}?`}>Hapus</ConfirmSubmit>
                      </ActionForm>
                    </div>
                  ))}
                  {pria.length === 0 ? (
                    <p className="text-xs text-zinc-400">Belum ada data.</p>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">
                  Pihak Pengantin Wanita ({wanita.length})
                </p>
                <div className="space-y-2">
                  {wanita.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{k.nama}</p>
                        <p className="text-xs text-zinc-500">{k.hubungan}</p>
                      </div>
                      <ActionForm action={deleteKeluargaAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <ConfirmSubmit message={`Hapus ${k.nama}?`}>Hapus</ConfirmSubmit>
                      </ActionForm>
                    </div>
                  ))}
                  {wanita.length === 0 ? (
                    <p className="text-xs text-zinc-400">Belum ada data.</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Tambah Keluarga">
        <ActionForm action={addKeluargaAction} className="space-y-3">
          <input type="hidden" name="eventId" value={event.id} />
          <div>
            <label className="label">Nama</label>
            <input name="nama" className="input" placeholder="cth: Bpk. Kurniawan" required />
          </div>
          <div>
            <label className="label">Hubungan</label>
            <input name="hubungan" className="input" placeholder="cth: Ayah / Ibu / Kakak" required />
          </div>
          <div>
            <label className="label">Pihak</label>
            <select name="pihak" className="input" defaultValue="PRIA">
              {PIHAK.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton className="w-full">Tambah</SubmitButton>
          <p className="text-xs text-zinc-400">
            <Badge variant="pink">Info</Badge> Data keluarga ditampilkan pada halaman undangan
            digital tamu.
          </p>
        </ActionForm>
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, formatRupiah } from "@/lib/constants";
import {
  createPaketAction,
  updatePaketAction,
  deletePaketAction,
} from "@/lib/actions/packages";
import { ActionForm, SubmitButton, ConfirmSubmit } from "@/components/forms";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { PaketCarousel } from "@/components/paket-carousel";

export const metadata = { title: "Paket" };

export default async function PackagesPage() {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  const pakets = await prisma.paket.findMany({
    orderBy: { nama: "asc" },
    include: {
      gambars: { orderBy: { urutan: "asc" } },
      _count: { select: { events: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Paket"
        description="Data paket pernikahan sebagai referensi internal (bukan katalog publik)"
      />

      <details className="card mb-6" open={pakets.length === 0}>
        <summary className="card-header cursor-pointer select-none text-sm font-semibold text-pink-600">
          + Tambah Paket
        </summary>
        <div className="card-body">
          <ActionForm action={createPaketAction} multipart className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Nama Paket</label>
              <input name="nama" className="input" placeholder="cth: Paket Gold" required />
            </div>
            <div>
              <label className="label">Harga (Rp)</label>
              <input name="harga" type="number" min="0" className="input" placeholder="150000000" required />
            </div>
            <div>
              <label className="label">Kapasitas Tamu (opsional)</label>
              <input name="kapasitas" type="number" min="0" className="input" placeholder="500" />
            </div>
            <div>
              <label className="label">Include (pisahkan dengan koma)</label>
              <input name="includeList" className="input" placeholder="Dekorasi, Katering, MUA" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Foto Paket (opsional, beberapa foto sekaligus, maks 8, JPG/PNG/WebP, maks 4MB per foto)</label>
              <input
                name="gambar"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Deskripsi</label>
              <textarea name="deskripsi" rows={3} className="input" placeholder="Deskripsi paket..." />
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Tambah Paket</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </details>

      {pakets.length === 0 ? (
        <EmptyState message="Belum ada paket terdaftar." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pakets.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <PaketCarousel images={p.gambars} alt={`Gambar ${p.nama}`} />
              <div className="card-header flex items-center justify-between gap-2">
                <div>
                  <h2 className="card-title">{p.nama}</h2>
                  <p className="mt-1 text-sm font-semibold text-pink-600">{formatRupiah(p.harga)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {p.aktif ? <Badge variant="green">Aktif</Badge> : <Badge variant="zinc">Nonaktif</Badge>}
                  <span className="text-xs text-zinc-400">{p._count.events} event</span>
                </div>
              </div>
              <div className="card-body">
                {p.deskripsi ? <p className="text-sm text-zinc-600">{p.deskripsi}</p> : null}
                {p.kapasitas ? (
                  <p className="mt-2 text-xs text-zinc-500">Kapasitas: {p.kapasitas} tamu</p>
                ) : null}
                {p.includeList ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.includeList.split(",").map((item, i) => (
                      <Badge key={i} variant="pink">
                        {item.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <details className="mt-4">
                  <summary className="btn-link cursor-pointer list-none">Edit / Hapus</summary>
                  <div className="mt-2 grid gap-3">
                    <ActionForm
                      action={updatePaketAction}
                      multipart
                      className="grid gap-2 rounded-lg border border-zinc-200 p-3"
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <input name="nama" className="input" defaultValue={p.nama} required />
                      <input name="harga" type="number" min="0" className="input" defaultValue={p.harga} required />
                      <input name="kapasitas" type="number" min="0" className="input" defaultValue={p.kapasitas ?? ""} />
                      <input name="includeList" className="input" defaultValue={p.includeList ?? ""} />
                      <textarea name="deskripsi" rows={2} className="input" defaultValue={p.deskripsi ?? ""} />
                      {p.gambars.length > 0 ? (
                        <div className="rounded-lg border border-zinc-200 p-2">
                          <p className="mb-2 text-xs font-medium text-zinc-600">
                            Foto saat ini ({p.gambars.length}), centang untuk hapus:
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {p.gambars.map((g) => (
                              <label key={g.id} className="group cursor-pointer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={g.path}
                                  alt={`Foto ${p.nama} ${g.urutan + 1}`}
                                  className="h-20 w-full rounded object-cover"
                                />
                                <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                                  <input
                                    type="checkbox"
                                    name="hapusGambarIds"
                                    value={g.id}
                                    className="accent-pink-600"
                                  />
                                  Hapus
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <label className="label">
                          Tambah Foto {p.gambars.length > 0 ? "(opsional)" : "(JPG/PNG/WebP, maks 4MB)"}
                        </label>
                        <input
                          name="gambar"
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="input"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-zinc-600">
                        <input type="checkbox" name="aktif" defaultChecked={p.aktif} className="accent-pink-600" />
                        Paket aktif
                      </label>
                      <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                        Simpan
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={deletePaketAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit message={`Hapus paket "${p.nama}"?`}>
                        Hapus Paket
                      </ConfirmSubmit>
                    </ActionForm>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

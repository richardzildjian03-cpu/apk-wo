import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, KATEGORI_TAMU, KATEGORI_LABELS } from "@/lib/constants";
import {
  addTamuAction,
  importTamuAction,
  updateTamuAction,
  deleteTamuAction,
} from "@/lib/actions/guests";
import { ActionForm, SubmitButton, ConfirmSubmit, CopyButton } from "@/components/forms";
import { Card, EmptyState, TamuStatusBadge, RsvpBadge, StatCard } from "@/components/ui";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const metadata = { title: "Tamu & QR" };

function siteUrl(host: string | null): string {
  if (!host) return "";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function KlienTamuPage({ params }: Props) {
  const session = await requireRole(ROLES.KLIEN);
  const { eventId } = await params;
  const id = Number(eventId);

  const [event, headerList] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { tamu: { include: { rsvp: true }, orderBy: { nama: "asc" } } },
    }),
    headers(),
  ]);
  if (!event || event.klienId !== session.id) notFound();

  const base = siteUrl(headerList.get("host"));
  const tamuList = event.tamu;
  const vipCount = tamuList.filter((t) => t.status === "VIP").length;
  const kursiTotal = tamuList.reduce((s, t) => s + t.jumlahKursi, 0);
  const sudahRsvp = tamuList.filter((t) => t.rsvp).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Tamu" value={tamuList.length} variant="zinc" />
        <StatCard label="Tamu VIP" value={vipCount} variant="violet" />
        <StatCard label="Total Kursi" value={kursiTotal} variant="pink" />
        <StatCard label="Sudah RSVP" value={`${sudahRsvp}/${tamuList.length}`} variant="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <details className="card lg:col-span-1" open={tamuList.length === 0}>
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-pink-600">
            + Tambah Tamu
          </summary>
          <div className="card-body">
            <ActionForm action={addTamuAction} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div>
                <label className="label">Nama Tamu / Rombongan</label>
                <input name="nama" className="input" placeholder="cth: Keluarga Bpk. Joko" required />
              </div>
              <div>
                <label className="label">Kategori</label>
                <select name="kategori" className="input" defaultValue="TEMAN">
                  {KATEGORI_TAMU.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status Tamu</label>
                <select name="status" className="input" defaultValue="REGULAR">
                  <option value="REGULAR">Regular</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jumlah Kursi</label>
                  <input name="jumlahKursi" type="number" min="1" max="20" className="input" defaultValue={1} />
                </div>
                <div>
                  <label className="label">No. WA</label>
                  <input name="noWa" className="input" placeholder="08xxxxxxxxxx" />
                </div>
              </div>
              <SubmitButton className="w-full">Tambah Tamu</SubmitButton>
              <p className="text-xs text-zinc-400">
                QR code undangan dibuat otomatis untuk setiap tamu.
              </p>
            </ActionForm>
          </div>
        </details>

        <details className="card lg:col-span-2">
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-zinc-700">
            Import Tamu Massal (Excel/CSV)
          </summary>
          <div className="card-body">
            <ActionForm action={importTamuAction} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <p className="text-xs text-zinc-500">
                Tempel data dari Excel/CSV, satu tamu per baris, urutan kolom:
              </p>
              <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
                Nama; Kategori; VIP/REGULAR; JumlahKursi; NoWA
              </p>
              <textarea
                name="data"
                rows={6}
                className="input font-mono text-xs"
                placeholder={"Keluarga Bpk. Joko; KELUARGA_WANITA; VIP; 4; 081234567890\nAndi Pratama; TEMAN; REGULAR; 1; 081234567891"}
              />
              <SubmitButton>Import</SubmitButton>
              <p className="text-xs text-zinc-400">
                Kategori: KELUARGA_PRIA, KELUARGA_WANITA, TEMAN, KOLEGA. NoWA opsional.
              </p>
            </ActionForm>
          </div>
        </details>
      </div>

      <Card title={`Daftar Tamu & QR (${tamuList.length})`}>
        {tamuList.length === 0 ? (
          <EmptyState message="Belum ada tamu. Tambahkan tamu untuk membuat undangan digital QR." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>QR</th>
                  <th>Nama</th>
                  <th className="hidden md:table-cell">Kategori</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Kursi</th>
                  <th>RSVP</th>
                  <th>Tautan Undangan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tamuList.map((t) => {
                  const url = `${base}/undangan/${t.qrToken}`;
                  const waUrl = t.noWa
                    ? `https://wa.me/${t.noWa.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
                        `Kepada Yth. ${t.nama},\n\nKami mengundang Anda pada acara ${event.namaAcara}. Buka undangan digital Anda di tautan berikut:\n${url}`,
                      )}`
                    : null;
                  return (
                    <tr key={t.id}>
                      <td>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/qr/${t.qrToken}`}
                          alt={`QR ${t.nama}`}
                          width={48}
                          height={48}
                          className="rounded-md border border-zinc-200"
                        />
                      </td>
                      <td className="font-medium text-zinc-900">
                        {t.nama}
                        {t.noWa ? (
                          <p className="text-xs font-normal text-zinc-400">{t.noWa}</p>
                        ) : null}
                      </td>
                      <td className="hidden md:table-cell">
                        {KATEGORI_LABELS[t.kategori] ?? t.kategori}
                      </td>
                      <td>
                        <TamuStatusBadge status={t.status} />
                      </td>
                      <td className="hidden md:table-cell">{t.jumlahKursi}</td>
                      <td>
                        <RsvpBadge status={t.rsvp?.status ?? null} />
                        {t.rsvp?.status === "HADIR" ? (
                          <p className="mt-0.5 text-xs text-zinc-400">{t.rsvp.jumlahHadir} orang</p>
                        ) : null}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <CopyButton text={url} label="Salin" />
                          {waUrl ? (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5 text-xs">
                              Kirim WA
                            </a>
                          ) : null}
                          <a
                            href={`/api/qr/${t.qrToken}`}
                            download={`qr-${t.nama.replace(/[^a-zA-Z0-9]/g, "_")}.png`}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            Unduh QR
                          </a>
                        </div>
                      </td>
                      <td>
                        <details>
                          <summary className="btn-link cursor-pointer list-none">Aksi</summary>
                          <div className="mt-2 grid gap-3">
                            <ActionForm
                              action={updateTamuAction}
                              className="grid gap-2 rounded-lg border border-zinc-200 p-3"
                            >
                              <input type="hidden" name="id" value={t.id} />
                              <input name="nama" className="input" defaultValue={t.nama} required />
                              <select name="kategori" className="input" defaultValue={t.kategori}>
                                {KATEGORI_TAMU.map((k) => (
                                  <option key={k.value} value={k.value}>
                                    {k.label}
                                  </option>
                                ))}
                              </select>
                              <select name="status" className="input" defaultValue={t.status}>
                                <option value="REGULAR">Regular</option>
                                <option value="VIP">VIP</option>
                              </select>
                              <input
                                name="jumlahKursi"
                                type="number"
                                min="1"
                                max="20"
                                className="input"
                                defaultValue={t.jumlahKursi}
                              />
                              <input name="noWa" className="input" defaultValue={t.noWa ?? ""} />
                              <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                                Simpan
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm action={deleteTamuAction}>
                              <input type="hidden" name="id" value={t.id} />
                              <ConfirmSubmit
                                message={`Hapus tamu "${t.nama}"? Tautan undangan & QR-nya menjadi tidak valid.`}
                              >
                                Hapus Tamu
                              </ConfirmSubmit>
                            </ActionForm>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

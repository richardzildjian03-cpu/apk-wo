import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import {
  ROLES,
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  KATEGORI_LABELS,
  KONFIRMASI_LABELS,
  formatTanggal,
  formatRupiah,
} from "@/lib/constants";
import {
  updateEventAction,
  deleteEventAction,
  addRundownAction,
  deleteRundownAction,
  assignVendorAction,
  updatePenugasanAction,
  removePenugasanAction,
} from "@/lib/actions/events";
import { ActionForm, SubmitButton, ConfirmSubmit, PrintButton } from "@/components/forms";
import {
  PageHeader,
  Card,
  Badge,
  Tabs,
  EventStatusBadge,
  RsvpBadge,
  TamuStatusBadge,
  StatCard,
  EmptyState,
} from "@/components/ui";

export const metadata = { title: "Detail Event" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const session = await requireInternal();
  const { id } = await params;
  const { tab } = await searchParams;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) notFound();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      klien: true,
      leader: true,
      paket: true,
      rundown: { orderBy: { waktu: "asc" } },
      vendors: { include: { vendor: true } },
      tamu: { include: { rsvp: true, checkIn: true }, orderBy: { nama: "asc" } },
      pengantin: true,
    },
  });
  if (!event) notFound();

  const isLeader = session.role === ROLES.LEADER;
  if (isLeader && event.leaderId !== session.id) notFound();
  const canManage = !isLeader;

  const activeTab = ["rundown", "vendor", "tamu", "rekap"].includes(String(tab))
    ? String(tab)
    : "rundown";

  const [pakets, leaders, allVendors] = await Promise.all([
    canManage ? prisma.paket.findMany({ orderBy: { nama: "asc" } }) : Promise.resolve([]),
    canManage
      ? prisma.user.findMany({ where: { role: "LEADER" }, orderBy: { nama: "asc" } })
      : Promise.resolve([]),
    prisma.vendor.findMany({ orderBy: { nama: "asc" } }),
  ]);

  const rsvpHadir = event.tamu.filter((t) => t.rsvp?.status === "HADIR");
  const rsvpTidak = event.tamu.filter((t) => t.rsvp?.status === "TIDAK");
  const rsvpKosong = event.tamu.filter((t) => !t.rsvp);
  const vipHadir = rsvpHadir.filter((t) => t.status === "VIP");
  const checkedIn = event.tamu.filter((t) => t.checkIn);

  return (
    <div>
      <PageHeader title={event.namaAcara} description={`${formatTanggal(event.tanggal)} • ${event.lokasi}`}>
        <Link href={`/events/${event.id}/checkin`} className="btn-success">
          Check-in Tamu
        </Link>
        <Link href="/events" className="btn-secondary">
          &larr; Daftar Event
        </Link>
      </PageHeader>

      <div className="card mb-6">
        <div className="card-body grid gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase">Status</p>
            <div className="mt-1">
              <EventStatusBadge status={event.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase">Klien</p>
            <p className="mt-1 font-medium text-zinc-900">{event.klien.nama}</p>
            <p className="text-xs text-zinc-500">{event.klien.email}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase">Leader WO</p>
            <p className="mt-1 font-medium text-zinc-900">{event.leader?.nama ?? "Belum ditentukan"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase">Paket</p>
            <p className="mt-1 font-medium text-zinc-900">
              {event.paket ? `${event.paket.nama} (${formatRupiah(event.paket.harga)})` : "-"}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "rundown", label: "Rundown" },
          { key: "vendor", label: "Vendor" },
          { key: "tamu", label: `Tamu (${event.tamu.length})` },
          { key: "rekap", label: "Rekap Kehadiran" },
        ]}
        active={activeTab}
        basePath={`/events/${event.id}`}
      />

      {activeTab === "rundown" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Jadwal / Rundown Acara">
              {event.rundown.length === 0 ? (
                <EmptyState message="Belum ada item rundown." />
              ) : (
                <div className="-m-4 overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th className="w-24">Waktu</th>
                        <th>Kegiatan</th>
                        <th className="hidden md:table-cell">PIC</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {event.rundown.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono">{item.waktu}</td>
                          <td className="font-medium text-zinc-900">{item.kegiatan}</td>
                          <td className="hidden md:table-cell">{item.pic ?? "-"}</td>
                          <td>
                            <ActionForm action={deleteRundownAction} className="inline">
                              <input type="hidden" name="id" value={item.id} />
                              <ConfirmSubmit message={`Hapus item "${item.kegiatan}"?`}>
                                Hapus
                              </ConfirmSubmit>
                            </ActionForm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
          <Card title="Tambah Rundown">
            <ActionForm action={addRundownAction} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div>
                <label className="label">Waktu</label>
                <input name="waktu" className="input" placeholder="cth: 08:00" required />
              </div>
              <div>
                <label className="label">Kegiatan</label>
                <input name="kegiatan" className="input" placeholder="cth: Akad Nikah" required />
              </div>
              <div>
                <label className="label">PIC</label>
                <input name="pic" className="input" placeholder="cth: Leader WO" />
              </div>
              <SubmitButton className="w-full">Tambah</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      ) : null}

      {activeTab === "vendor" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Vendor Ditugaskan">
              {event.vendors.length === 0 ? (
                <EmptyState message="Belum ada vendor yang ditugaskan." />
              ) : (
                <div className="-m-4 overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th className="hidden md:table-cell">Kategori</th>
                        <th className="hidden md:table-cell">Kontak</th>
                        <th>Konfirmasi</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {event.vendors.map((p) => (
                        <tr key={p.id}>
                          <td className="font-medium text-zinc-900">{p.vendor.nama}</td>
                          <td className="hidden md:table-cell">{p.vendor.kategoriLayanan}</td>
                          <td className="hidden md:table-cell">{p.vendor.kontak ?? "-"}</td>
                          <td>
                            <ActionForm action={updatePenugasanAction} className="flex items-center gap-2">
                              <input type="hidden" name="id" value={p.id} />
                              <select
                                name="statusKonfirmasi"
                                defaultValue={p.statusKonfirmasi}
                                className="input !w-auto !py-1 text-xs"
                              >
                                {Object.entries(KONFIRMASI_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>
                                    {l}
                                  </option>
                                ))}
                              </select>
                              <SubmitButton variant="secondary" className="!px-2 !py-1 text-xs">
                                Simpan
                              </SubmitButton>
                            </ActionForm>
                          </td>
                          <td>
                            <ActionForm action={removePenugasanAction} className="inline">
                              <input type="hidden" name="id" value={p.id} />
                              <ConfirmSubmit message={`Hapus penugasan ${p.vendor.nama}?`}>
                                Hapus
                              </ConfirmSubmit>
                            </ActionForm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
          <Card title="Tugaskan Vendor">
            <ActionForm action={assignVendorAction} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div>
                <label className="label">Vendor</label>
                <select name="vendorId" className="input" required defaultValue="">
                  <option value="" disabled>
                    Pilih vendor...
                  </option>
                  {allVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nama} — {v.kategoriLayanan}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton className="w-full">Tugaskan</SubmitButton>
              <p className="text-xs text-zinc-400">
                Daftar vendor dikelola di halaman <Link href="/vendors" className="btn-link">Vendor</Link>.
              </p>
            </ActionForm>
          </Card>
        </div>
      ) : null}

      {activeTab === "tamu" ? (
        <Card title="Daftar Tamu">
          <p className="mb-3 text-sm text-zinc-500">
            Data tamu dan undangan digital dikelola oleh klien (pengantin) melalui portal klien.
            Berikut tampilan baca-saja untuk tim internal.
          </p>
          {event.tamu.length === 0 ? (
            <EmptyState message="Belum ada tamu. Klien dapat menambahkan tamu dari portal klien." />
          ) : (
            <div className="-m-4 overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th className="hidden md:table-cell">Kategori</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Kursi</th>
                    <th>RSVP</th>
                  </tr>
                </thead>
                <tbody>
                  {event.tamu.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium text-zinc-900">{t.nama}</td>
                      <td className="hidden md:table-cell">{KATEGORI_LABELS[t.kategori] ?? t.kategori}</td>
                      <td>
                        <TamuStatusBadge status={t.status} />
                      </td>
                      <td className="hidden md:table-cell">{t.jumlahKursi}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <RsvpBadge status={t.rsvp?.status ?? null} />
                          {t.rsvp?.status === "HADIR" ? (
                            <span className="text-xs text-zinc-500">({t.rsvp.jumlahHadir} org)</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {activeTab === "rekap" ? (
        <div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Tamu" value={event.tamu.length} variant="zinc" />
            <StatCard label="Hadir" value={rsvpHadir.length} hint={`${rsvpHadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0)} orang`} variant="green" />
            <StatCard label="Tidak Hadir" value={rsvpTidak.length} variant="pink" />
            <StatCard label="Belum Menjawab" value={rsvpKosong.length} variant="violet" />
            <StatCard label="Check-in" value={checkedIn.length} hint="Tercatat datang" variant="green" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="violet">VIP Hadir: {vipHadir.length}</Badge>
            <Badge variant="green">
              Total Kursi Konfirmasi Hadir: {rsvpHadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0)} kursi
            </Badge>
            <div className="ml-auto flex gap-2">
              <a href={`/api/export/${event.id}`} className="btn-primary no-print">
                Unduh Excel (CSV)
              </a>
              <PrintButton />
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h2 className="card-title">Rincian Kehadiran</h2>
            </div>
            <div className="card-body">
              {event.tamu.length === 0 ? (
                <EmptyState message="Belum ada tamu." />
              ) : (
                <div className="-m-4 overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th className="hidden md:table-cell">Kategori</th>
                        <th>Status Tamu</th>
                        <th className="hidden md:table-cell">RSVP Diperbarui</th>
                        <th>RSVP</th>
                        <th>Jumlah Hadir</th>
                        <th className="hidden md:table-cell">Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.tamu.map((t) => (
                        <tr key={t.id}>
                          <td className="font-medium text-zinc-900">{t.nama}</td>
                          <td className="hidden md:table-cell">{KATEGORI_LABELS[t.kategori] ?? t.kategori}</td>
                          <td>
                            <TamuStatusBadge status={t.status} />
                          </td>
                          <td className="hidden md:table-cell">
                            {t.rsvp
                              ? new Intl.DateTimeFormat("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(t.rsvp.updatedAt)
                              : "-"}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {canManage ? (
        <details className="card mt-6">
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-zinc-700">
            Edit / Hapus Event
          </summary>
          <div className="card-body grid gap-6 lg:grid-cols-2">
            <ActionForm action={updateEventAction} className="space-y-3">
              <input type="hidden" name="id" value={event.id} />
              <div>
                <label className="label">Nama Acara</label>
                <input name="namaAcara" className="input" defaultValue={event.namaAcara} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Tanggal</label>
                  <input
                    name="tanggal"
                    type="datetime-local"
                    className="input"
                    defaultValue={toLocalInputValue(event.tanggal)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select name="status" className="input" defaultValue={event.status}>
                    {EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EVENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Lokasi</label>
                <input name="lokasi" className="input" defaultValue={event.lokasi} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Paket</label>
                  <select name="paketId" className="input" defaultValue={event.paketId ?? ""}>
                    <option value="">— Tanpa paket —</option>
                    {pakets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Leader WO</label>
                  <select name="leaderId" className="input" defaultValue={event.leaderId ?? ""}>
                    <option value="">— Belum ditentukan —</option>
                    {leaders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <SubmitButton>Simpan Perubahan</SubmitButton>
            </ActionForm>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-semibold text-red-700">Hapus Event</p>
              <p className="mb-4 text-xs text-red-600">
                Menghapus event akan menghapus seluruh data terkait: rundown, vendor, tamu, QR code,
                RSVP, dan data keluarga. Tindakan ini tidak dapat dibatalkan.
              </p>
              <ActionForm action={deleteEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <ConfirmSubmit
                  message={`Yakin hapus event "${event.namaAcara}"? Seluruh data terkait akan dihapus.`}
                >
                  Hapus Event Permanen
                </ConfirmSubmit>
              </ActionForm>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES, formatTanggal, formatRupiah } from "@/lib/constants";
import { createEventAction } from "@/lib/actions/events";
import { ActionForm, SubmitButton } from "@/components/forms";
import {
  PageHeader,
  Card,
  EventStatusBadge,
  EmptyState,
  Badge,
} from "@/components/ui";

export const metadata = { title: "Event" };

export default async function EventsPage() {
  const session = await requireInternal();
  const isLeader = session.role === ROLES.LEADER;
  const canManage = !isLeader;

  const events = await prisma.event.findMany({
    where: isLeader ? { leaderId: session.id } : {},
    orderBy: { tanggal: "desc" },
    include: {
      klien: true,
      leader: true,
      paket: true,
      _count: { select: { tamu: true, vendors: true, rundown: true } },
    },
  });

  let kliens: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  let pakets: Awaited<ReturnType<typeof prisma.paket.findMany>> = [];
  let leaders: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  if (canManage) {
    [kliens, pakets, leaders] = await Promise.all([
      prisma.user.findMany({ where: { role: "KLIEN" }, orderBy: { nama: "asc" } }),
      prisma.paket.findMany({ where: { aktif: true }, orderBy: { nama: "asc" } }),
      prisma.user.findMany({ where: { role: "LEADER" }, orderBy: { nama: "asc" } }),
    ]);
  }

  return (
    <div>
      <PageHeader
        title={isLeader ? "Event Saya" : "Event"}
        description={
          isLeader
            ? "Daftar event yang Anda ampu sebagai Leader WO"
            : "Daftar seluruh event pernikahan klien"
        }
      />

      {canManage ? (
        <details className="card mb-6">
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-pink-600">
            + Buat Event Baru
          </summary>
          <div className="card-body">
            <ActionForm action={createEventAction} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Nama Acara</label>
                <input name="namaAcara" className="input" placeholder="cth: Pernikahan Rina & Dedi" required />
              </div>

              <div>
                <label className="label">Tanggal Acara</label>
                <input name="tanggal" type="datetime-local" className="input" required />
              </div>
              <div>
                <label className="label">Lokasi</label>
                <input name="lokasi" className="input" placeholder="cth: Balai Sarbini, Jakarta" required />
              </div>

              <div>
                <label className="label">Klien (Akun Pengantin)</label>
                <select name="klienId" className="input" defaultValue="">
                  <option value="">— Buat akun klien baru (isi di bawah) —</option>
                  {kliens.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input" defaultValue="AKTIF">
                  <option value="DRAFT">Draft</option>
                  <option value="AKTIF">Aktif</option>
                </select>
              </div>

              <div>
                <label className="label">Paket (opsional)</label>
                <select name="paketId" className="input" defaultValue="">
                  <option value="">— Tanpa paket / custom —</option>
                  {pakets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — {formatRupiah(p.harga)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Leader WO (opsional)</label>
                <select name="leaderId" className="input" defaultValue="">
                  <option value="">— Belum ditentukan —</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <p className="label">atau Buat Akun Klien Baru</p>
                <div className="grid gap-3 rounded-lg border border-dashed border-zinc-300 p-4 md:grid-cols-2">
                  <div>
                    <label className="label">Nama Klien</label>
                    <input name="klienBaruNama" className="input" placeholder="cth: Rina & Dedi" />
                  </div>
                  <div>
                    <label className="label">Email Klien</label>
                    <input name="klienBaruEmail" type="email" className="input" placeholder="klien@email.com" />
                  </div>
                  <div>
                    <label className="label">No. WA</label>
                    <input name="klienBaruNoHp" className="input" placeholder="08xxxxxxxxxx" />
                  </div>
                  <div>
                    <label className="label">Password Awal</label>
                    <input name="klienBaruPassword" className="input" placeholder="default: password123" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <SubmitButton>Buat Event</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </details>
      ) : null}

      <Card>
        {events.length === 0 ? (
          <EmptyState message="Belum ada event." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Acara</th>
                  <th>Tanggal</th>
                  <th className="hidden md:table-cell">Lokasi</th>
                  <th className="hidden md:table-cell">Klien</th>
                  <th className="hidden lg:table-cell">Leader</th>
                  <th className="hidden lg:table-cell">Paket</th>
                  <th>Tamu</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="font-medium text-zinc-900">{event.namaAcara}</td>
                    <td className="whitespace-nowrap">{formatTanggal(event.tanggal)}</td>
                    <td className="hidden md:table-cell">{event.lokasi}</td>
                    <td className="hidden md:table-cell">{event.klien.nama}</td>
                    <td className="hidden lg:table-cell">
                      {event.leader?.nama ?? <Badge variant="zinc">Belum ada</Badge>}
                    </td>
                    <td className="hidden lg:table-cell">{event.paket?.nama ?? "-"}</td>
                    <td>{event._count.tamu}</td>
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

      {canManage ? (
        <details className="card mt-6">
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-zinc-700">
            Edit / Hapus Event
          </summary>
          <div className="card-body">
            <p className="mb-3 text-sm text-zinc-500">
              Buka halaman detail event, lalu gunakan bagian &quot;Edit Event&quot; di sana.
            </p>
            <div className="flex flex-wrap gap-2">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="btn-secondary">
                  {event.namaAcara}
                </Link>
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

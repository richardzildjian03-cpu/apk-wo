import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  createVendorAction,
  updateVendorAction,
  deleteVendorAction,
} from "@/lib/actions/vendors";
import { ActionForm, SubmitButton, ConfirmSubmit } from "@/components/forms";
import { PageHeader, Card, EmptyState } from "@/components/ui";

export const metadata = { title: "Vendor" };

export default async function VendorsPage() {
  const session = await requireInternal();
  const canManage = session.role !== ROLES.LEADER;

  const vendors = await prisma.vendor.findMany({
    orderBy: { nama: "asc" },
    include: { _count: { select: { penugasan: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Vendor"
        description="Daftar penyedia layanan (dekorasi, katering, makeup, fotografi, dll)"
      />

      {canManage ? (
        <details className="card mb-6" open={vendors.length === 0}>
          <summary className="card-header cursor-pointer select-none text-sm font-semibold text-pink-600">
            + Tambah Vendor
          </summary>
          <div className="card-body">
            <ActionForm action={createVendorAction} className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">Nama Vendor</label>
                <input name="nama" className="input" placeholder="cth: Dekorasi Melati" required />
              </div>
              <div>
                <label className="label">Kategori Layanan</label>
                <input name="kategoriLayanan" className="input" placeholder="cth: Dekorasi" required />
              </div>
              <div>
                <label className="label">Kontak (WA)</label>
                <input name="kontak" className="input" placeholder="08xxxxxxxxxx" />
              </div>
              <div className="md:col-span-3">
                <SubmitButton>Tambah Vendor</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </details>
      ) : null}

      <Card title={`Daftar Vendor (${vendors.length})`}>
        {vendors.length === 0 ? (
          <EmptyState message="Belum ada vendor terdaftar." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kategori Layanan</th>
                  <th className="hidden md:table-cell">Kontak</th>
                  <th className="hidden md:table-cell">Event Aktif</th>
                  {canManage ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="font-medium text-zinc-900">
                      {v.nama}
                      {!canManage ? (
                        <details className="mt-1 md:hidden">
                          <summary className="text-xs text-zinc-400">Detail</summary>
                          <p className="mt-1 text-xs text-zinc-500">{v.kategoriLayanan}</p>
                          <p className="text-xs text-zinc-500">{v.kontak ?? "-"}</p>
                        </details>
                      ) : null}
                    </td>
                    <td>{v.kategoriLayanan}</td>
                    <td className="hidden md:table-cell">{v.kontak ?? "-"}</td>
                    <td className="hidden md:table-cell">{v._count.penugasan}</td>
                    {canManage ? (
                      <td>
                        <details>
                          <summary className="btn-link cursor-pointer list-none">Aksi</summary>
                          <div className="mt-2 grid gap-3">
                            <ActionForm action={updateVendorAction} className="grid gap-2 rounded-lg border border-zinc-200 p-3">
                              <input type="hidden" name="id" value={v.id} />
                              <input name="nama" className="input" defaultValue={v.nama} required />
                              <input
                                name="kategoriLayanan"
                                className="input"
                                defaultValue={v.kategoriLayanan}
                                required
                              />
                              <input name="kontak" className="input" defaultValue={v.kontak ?? ""} />
                              <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                                Simpan
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm action={deleteVendorAction}>
                              <input type="hidden" name="id" value={v.id} />
                              <ConfirmSubmit message={`Hapus vendor "${v.nama}"?`}>
                                Hapus Vendor
                              </ConfirmSubmit>
                            </ActionForm>
                          </div>
                        </details>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-zinc-400">
        Penugasan vendor ke event dilakukan dari halaman detail event (tab Vendor).{" "}
        <Link href="/events" className="btn-link">
          Buka daftar event
        </Link>
      </p>
    </div>
  );
}

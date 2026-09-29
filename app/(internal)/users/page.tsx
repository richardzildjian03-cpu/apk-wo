import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import {
  createUserAction,
  updateUserAction,
  resetPasswordAction,
  deleteUserAction,
} from "@/lib/actions/users";
import { ActionForm, SubmitButton, ConfirmSubmit } from "@/components/forms";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

export const metadata = { title: "Pengguna" };

const ROLE_VARIANTS: Record<string, "pink" | "violet" | "amber" | "green"> = {
  BOS: "pink",
  LEADER: "violet",
  STAFF: "amber",
  KLIEN: "green",
};

export default async function UsersPage() {
  const session = await requireRole(ROLES.BOS, ROLES.STAFF);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { nama: "asc" }],
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      noHp: true,
      _count: { select: { eventsAsKlien: true, eventsAsLeader: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Pengguna"
        description="Kelola akun bos, leader, staff, dan klien (pengantin). Akun klien dibuat oleh WO — tidak ada registrasi mandiri."
      />

      <details className="card mb-6" open={users.length === 0}>
        <summary className="card-header cursor-pointer select-none text-sm font-semibold text-pink-600">
          + Buat Akun Baru
        </summary>
        <div className="card-body">
          <ActionForm action={createUserAction} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input name="nama" className="input" placeholder="cth: Rina & Dedi" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="nama@email.com" required />
            </div>
            <div>
              <label className="label">Role</label>
              <select name="role" className="input" defaultValue="KLIEN" required>
                <option value="BOS">Bos (Owner)</option>
                <option value="LEADER">Leader WO</option>
                <option value="STAFF">Staff Admin</option>
                <option value="KLIEN">Klien (Pengantin)</option>
              </select>
            </div>
            <div>
              <label className="label">No. WA</label>
              <input name="noHp" className="input" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" placeholder="Minimal 6 karakter" required />
            </div>
            <div className="flex items-end">
              <SubmitButton>Buat Akun</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </details>

      <Card title={`Daftar Pengguna (${users.length})`}>
        {users.length === 0 ? (
          <EmptyState message="Belum ada pengguna." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th>Role</th>
                  <th className="hidden lg:table-cell">No. WA</th>
                  <th className="hidden lg:table-cell">Event</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium text-zinc-900">
                      {u.nama}
                      {u.id === session.id ? (
                        <span className="ml-1 text-xs text-zinc-400">(Anda)</span>
                      ) : null}
                    </td>
                    <td className="hidden md:table-cell">{u.email}</td>
                    <td>
                      <Badge variant={ROLE_VARIANTS[u.role] ?? "zinc"}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="hidden lg:table-cell">{u.noHp ?? "-"}</td>
                    <td className="hidden lg:table-cell">
                      {u._count.eventsAsKlien + u._count.eventsAsLeader}
                    </td>
                    <td>
                      <details>
                        <summary className="btn-link cursor-pointer list-none">Aksi</summary>
                        <div className="mt-2 grid gap-3">
                          <ActionForm
                            action={updateUserAction}
                            className="grid gap-2 rounded-lg border border-zinc-200 p-3"
                          >
                            <input type="hidden" name="id" value={u.id} />
                            <input name="nama" className="input" defaultValue={u.nama} required />
                            <input name="email" type="email" className="input" defaultValue={u.email} required />
                            <select name="role" className="input" defaultValue={u.role}>
                              <option value="BOS">Bos (Owner)</option>
                              <option value="LEADER">Leader WO</option>
                              <option value="STAFF">Staff Admin</option>
                              <option value="KLIEN">Klien (Pengantin)</option>
                            </select>
                            <input name="noHp" className="input" defaultValue={u.noHp ?? ""} />
                            <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                              Simpan
                            </SubmitButton>
                          </ActionForm>

                          <ActionForm
                            action={resetPasswordAction}
                            className="grid gap-2 rounded-lg border border-zinc-200 p-3"
                          >
                            <input type="hidden" name="id" value={u.id} />
                            <label className="label !mb-0">Reset Password Baru</label>
                            <input
                              name="password"
                              type="password"
                              className="input"
                              placeholder="Minimal 6 karakter"
                              required
                            />
                            <SubmitButton variant="secondary" className="!py-1.5 text-xs">
                              Reset Password
                            </SubmitButton>
                          </ActionForm>

                          {u.id !== session.id ? (
                            <ActionForm action={deleteUserAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <ConfirmSubmit message={`Hapus akun "${u.nama}"?`}>
                                Hapus Akun
                              </ConfirmSubmit>
                            </ActionForm>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

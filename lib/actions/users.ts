"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const VALID_ROLES = Object.values(ROLES) as string[];

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const nama = String(formData.get("nama") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "");
    const noHp = String(formData.get("noHp") ?? "").trim() || null;

    if (!nama || !email || !password || !role) {
      return { ok: false, message: "Nama, email, password, dan role wajib diisi." };
    }
    if (!VALID_ROLES.includes(role)) {
      return { ok: false, message: "Role tidak valid." };
    }
    if (password.length < 6) {
      return { ok: false, message: "Password minimal 6 karakter." };
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { ok: false, message: `Email ${email} sudah terdaftar.` };
    }

    await prisma.user.create({
      data: { nama, email, passwordHash: hashPassword(password), role, noHp },
    });
    return { ok: true, message: `Akun ${nama} berhasil dibuat.` };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    const nama = String(formData.get("nama") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "");
    const noHp = String(formData.get("noHp") ?? "").trim() || null;

    if (!id || !nama || !email || !VALID_ROLES.includes(role)) {
      return { ok: false, message: "Data tidak lengkap atau tidak valid." };
    }

    const duplicate = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (duplicate) {
      return { ok: false, message: `Email ${email} sudah dipakai akun lain.` };
    }

    await prisma.user.update({ where: { id }, data: { nama, email, role, noHp } });
    return { ok: true, message: "Data akun berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    const password = String(formData.get("password") ?? "");
    if (!id || password.length < 6) {
      return { ok: false, message: "Password minimal 6 karakter." };
    }

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashPassword(password) },
    });
    return { ok: true, message: "Password berhasil direset." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, message: "ID tidak valid." };
    if (id === session.id) {
      return { ok: false, message: "Tidak dapat menghapus akun sendiri." };
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { _count: { select: { eventsAsKlien: true, eventsAsLeader: true } } },
    });
    if (user && (user._count.eventsAsKlien > 0 || user._count.eventsAsLeader > 0)) {
      return {
        ok: false,
        message:
          "Akun tidak dapat dihapus karena masih terkait dengan event. Hapus event terkait terlebih dahulu.",
      };
    }

    await prisma.user.delete({ where: { id } });
    return { ok: true, message: "Akun berhasil dihapus." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

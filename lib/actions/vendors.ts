"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

export async function createVendorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const nama = String(formData.get("nama") ?? "").trim();
    const kategoriLayanan = String(formData.get("kategoriLayanan") ?? "").trim();
    const kontak = String(formData.get("kontak") ?? "").trim() || null;

    if (!nama || !kategoriLayanan) {
      return { ok: false, message: "Nama dan kategori layanan wajib diisi." };
    }

    await prisma.vendor.create({ data: { nama, kategoriLayanan, kontak } });
    return { ok: true, message: `Vendor "${nama}" berhasil ditambahkan.` };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updateVendorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    const nama = String(formData.get("nama") ?? "").trim();
    const kategoriLayanan = String(formData.get("kategoriLayanan") ?? "").trim();
    const kontak = String(formData.get("kontak") ?? "").trim() || null;

    if (!id || !nama || !kategoriLayanan) {
      return { ok: false, message: "Data tidak lengkap." };
    }

    await prisma.vendor.update({ where: { id }, data: { nama, kategoriLayanan, kontak } });
    return { ok: true, message: "Vendor berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteVendorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, message: "ID tidak valid." };

    await prisma.vendor.delete({ where: { id } });
    return { ok: true, message: "Vendor berhasil dihapus." };
  } catch {
    return {
      ok: false,
      message: "Vendor tidak dapat dihapus. Hapus penugasan vendor pada event terlebih dahulu.",
    };
  }
}

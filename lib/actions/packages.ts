"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { deletePaketImage, savePaketImage } from "@/lib/uploads";

function parseHarga(raw: FormDataEntryValue | null): number {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : -1;
}

function parseKapasitas(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : -1;
}

export async function createPaketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const nama = String(formData.get("nama") ?? "").trim();
    const deskripsi = String(formData.get("deskripsi") ?? "").trim() || null;
    const harga = parseHarga(formData.get("harga"));
    const includeList = String(formData.get("includeList") ?? "").trim() || null;
    const kapasitas = parseKapasitas(formData.get("kapasitas"));
    const file = formData.get("gambar");

    if (!nama) return { ok: false, message: "Nama paket wajib diisi." };
    if (harga < 0) return { ok: false, message: "Harga tidak valid." };
    if (kapasitas !== null && kapasitas < 0) {
      return { ok: false, message: "Kapasitas tidak valid." };
    }

    let gambar: string | null = null;
    if (file instanceof File && file.size > 0) {
      const res = await savePaketImage(file);
      if (!res.ok) return { ok: false, message: res.error };
      gambar = res.publicPath;
    }

    await prisma.paket.create({
      data: { nama, deskripsi, harga, includeList, kapasitas, gambar },
    });
    return { ok: true, message: `Paket "${nama}" berhasil dibuat.` };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updatePaketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    const nama = String(formData.get("nama") ?? "").trim();
    const deskripsi = String(formData.get("deskripsi") ?? "").trim() || null;
    const harga = parseHarga(formData.get("harga"));
    const includeList = String(formData.get("includeList") ?? "").trim() || null;
    const kapasitas = parseKapasitas(formData.get("kapasitas"));
    const aktif = formData.get("aktif") === "on";
    const hapusGambar = formData.get("hapusGambar") === "on";
    const file = formData.get("gambar");

    if (!id || !nama) return { ok: false, message: "Data tidak lengkap." };
    if (harga < 0) return { ok: false, message: "Harga tidak valid." };
    if (kapasitas !== null && kapasitas < 0) {
      return { ok: false, message: "Kapasitas tidak valid." };
    }

    const existing = await prisma.paket.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Paket tidak ditemukan." };

    let gambar: string | null = existing.gambar;

    if (hapusGambar) {
      await deletePaketImage(existing.gambar);
      gambar = null;
    }

    if (file instanceof File && file.size > 0) {
      const res = await savePaketImage(file);
      if (!res.ok) return { ok: false, message: res.error };
      if (existing.gambar && existing.gambar !== res.publicPath) {
        await deletePaketImage(existing.gambar);
      }
      gambar = res.publicPath;
    }

    await prisma.paket.update({
      where: { id },
      data: { nama, deskripsi, harga, includeList, kapasitas, aktif, gambar },
    });
    return { ok: true, message: "Paket berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deletePaketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, message: "ID tidak valid." };

    const existing = await prisma.paket.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Paket tidak ditemukan." };

    await deletePaketImage(existing.gambar);
    await prisma.paket.delete({ where: { id } });
    return { ok: true, message: "Paket berhasil dihapus." };
  } catch {
    return { ok: false, message: "Paket tidak dapat dihapus." };
  }
}

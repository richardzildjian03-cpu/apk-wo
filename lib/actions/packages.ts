"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { deletePaketImage, savePaketImage } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

const MAX_GAMBAR = 8;

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

function getValidFiles(formData: FormData): File[] {
  return formData
    .getAll("gambar")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

async function simpanGambarBaru(
  paketId: number,
  files: File[],
  mulaiUrutan: number,
): Promise<string | null> {
  const data: { paketId: number; path: string; urutan: number }[] = [];
  let urutan = mulaiUrutan;
  for (const file of files) {
    const res = await savePaketImage(file);
    if (!res.ok) return res.error;
    data.push({ paketId, path: res.publicPath, urutan: urutan++ });
  }
  if (data.length > 0) {
    await prisma.paketGambar.createMany({ data });
  }
  return null;
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
    const files = getValidFiles(formData);

    if (!nama) return { ok: false, message: "Nama paket wajib diisi." };
    if (harga < 0) return { ok: false, message: "Harga tidak valid." };
    if (kapasitas !== null && kapasitas < 0) {
      return { ok: false, message: "Kapasitas tidak valid." };
    }
    if (files.length > MAX_GAMBAR) {
      return { ok: false, message: `Maksimal ${MAX_GAMBAR} foto per paket.` };
    }

    const paket = await prisma.paket.create({
      data: { nama, deskripsi, harga, includeList, kapasitas },
    });

    const err = await simpanGambarBaru(paket.id, files, 0);
    if (err) {
      await prisma.paket.delete({ where: { id: paket.id } });
      return { ok: false, message: err };
    }
    revalidatePath("/packages");
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
    const hapusIds = formData
      .getAll("hapusGambarIds")
      .flatMap((v) => String(v).split(","))
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    const files = getValidFiles(formData);

    if (!id || !nama) return { ok: false, message: "Data tidak lengkap." };
    if (harga < 0) return { ok: false, message: "Harga tidak valid." };
    if (kapasitas !== null && kapasitas < 0) {
      return { ok: false, message: "Kapasitas tidak valid." };
    }

    const existing = await prisma.paket.findUnique({
      where: { id },
      include: { gambars: { orderBy: { urutan: "asc" } } },
    });
    if (!existing) return { ok: false, message: "Paket tidak ditemukan." };

    const sisa = existing.gambars.filter((g) => !hapusIds.includes(g.id));
    if (sisa.length + files.length > MAX_GAMBAR) {
      return { ok: false, message: `Maksimal ${MAX_GAMBAR} foto per paket.` };
    }

    for (const gid of hapusIds) {
      const g = existing.gambars.find((x) => x.id === gid);
      if (g) {
        await prisma.paketGambar.delete({ where: { id: gid } });
        await deletePaketImage(g.path);
      }
    }

    const err = await simpanGambarBaru(
      id,
      files,
      sisa.length > 0 ? Math.max(...sisa.map((g) => g.urutan)) + 1 : 0,
    );
    if (err) return { ok: false, message: err };

    await prisma.paket.update({
      where: { id },
      data: { nama, deskripsi, harga, includeList, kapasitas, aktif },
    });
    revalidatePath("/packages");
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

    const existing = await prisma.paket.findUnique({
      where: { id },
      include: { gambars: true },
    });
    if (!existing) return { ok: false, message: "Paket tidak ditemukan." };

    for (const g of existing.gambars) {
      await deletePaketImage(g.path);
    }
    await prisma.paket.delete({ where: { id } });
    revalidatePath("/packages");
    return { ok: true, message: "Paket berhasil dihapus." };
  } catch {
    return { ok: false, message: "Paket tidak dapat dihapus." };
  }
}

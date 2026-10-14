"use server";

import { prisma } from "@/lib/prisma";
import { generateToken, requireUser } from "@/lib/auth";
import { ROLES, KATEGORI_LABELS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertEventAccess(
  session: SessionUser,
  eventId: number,
  options: { allowKlien: boolean },
): Promise<boolean> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (session.role === ROLES.BOS || session.role === ROLES.STAFF) return true;
  if (session.role === ROLES.LEADER) return event.leaderId === session.id;
  if (session.role === ROLES.KLIEN && options.allowKlien) return event.klienId === session.id;
  return false;
}

/* ---------- Pengantin ---------- */

export async function savePengantinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    if (!session || !(await assertEventAccess(session, eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const priaLengkap = String(formData.get("priaNamaLengkap") ?? "").trim();
    const wanitaLengkap = String(formData.get("wanitaNamaLengkap") ?? "").trim();
    if (!priaLengkap || !wanitaLengkap) {
      return { ok: false, message: "Nama lengkap kedua pengantin wajib diisi." };
    }

    const dataByPihak = [
      {
        pihak: "PRIA",
        namaLengkap: priaLengkap,
        namaPanggilan: String(formData.get("priaNamaPanggilan") ?? "").trim() || null,
        anakKeRaw: String(formData.get("priaAnakKe") ?? "").trim(),
        namaOrtu: String(formData.get("priaNamaOrtu") ?? "").trim() || null,
      },
      {
        pihak: "WANITA",
        namaLengkap: wanitaLengkap,
        namaPanggilan: String(formData.get("wanitaNamaPanggilan") ?? "").trim() || null,
        anakKeRaw: String(formData.get("wanitaAnakKe") ?? "").trim(),
        namaOrtu: String(formData.get("wanitaNamaOrtu") ?? "").trim() || null,
      },
    ];

    for (const d of dataByPihak) {
      const anakKe = d.anakKeRaw ? Number(d.anakKeRaw) : null;
      const existing = await prisma.pengantin.findFirst({
        where: { eventId, pihak: d.pihak },
      });
      if (existing) {
        await prisma.pengantin.update({
          where: { id: existing.id },
          data: {
            namaLengkap: d.namaLengkap,
            namaPanggilan: d.namaPanggilan,
            anakKe,
            namaOrtu: d.namaOrtu,
          },
        });
      } else {
        await prisma.pengantin.create({
          data: {
            eventId,
            pihak: d.pihak,
            namaLengkap: d.namaLengkap,
            namaPanggilan: d.namaPanggilan,
            anakKe,
            namaOrtu: d.namaOrtu,
          },
        });
      }
    }

    revalidatePath(`/klien/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    return { ok: true, message: "Data pengantin berhasil disimpan." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

/* ---------- Keluarga ---------- */

export async function addKeluargaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    if (!(await assertEventAccess(session, eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const nama = String(formData.get("nama") ?? "").trim();
    const hubungan = String(formData.get("hubungan") ?? "").trim();
    const pihak = String(formData.get("pihak") ?? "PRIA");
    if (!nama || !hubungan) {
      return { ok: false, message: "Nama dan hubungan keluarga wajib diisi." };
    }
    if (!["PRIA", "WANITA"].includes(pihak)) {
      return { ok: false, message: "Pihak tidak valid." };
    }

    await prisma.keluarga.create({ data: { eventId, nama, hubungan, pihak } });
    revalidatePath(`/klien/${eventId}/keluarga`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    return { ok: true, message: "Data keluarga berhasil ditambahkan." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteKeluargaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const id = Number(formData.get("id"));
    const item = await prisma.keluarga.findUnique({ where: { id } });
    if (!item) return { ok: false, message: "Data keluarga tidak ditemukan." };
    if (!(await assertEventAccess(session, item.eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    await prisma.keluarga.delete({ where: { id } });
    revalidatePath(`/klien/${item.eventId}/keluarga`);
    revalidatePath(`/events/${item.eventId}`);
    revalidatePath(`/events/${item.eventId}`, "page");
    return { ok: true, message: "Data keluarga dihapus." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menghapus." };
  }
}

/* ---------- Tamu ---------- */

const VALID_KATEGORI = Object.keys(KATEGORI_LABELS);

export async function addTamuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    if (!(await assertEventAccess(session, eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const nama = String(formData.get("nama") ?? "").trim();
    const kategori = String(formData.get("kategori") ?? "TEMAN");
    const status = String(formData.get("status") ?? "REGULAR");
    const jumlahKursi = Number(formData.get("jumlahKursi") ?? 1);
    const noWa = String(formData.get("noWa") ?? "").trim() || null;

    if (!nama) return { ok: false, message: "Nama tamu wajib diisi." };
    if (!VALID_KATEGORI.includes(kategori)) {
      return { ok: false, message: "Kategori tidak valid." };
    }
    if (!["VIP", "REGULAR"].includes(status)) {
      return { ok: false, message: "Status tamu tidak valid." };
    }
    if (!Number.isFinite(jumlahKursi) || jumlahKursi < 1 || jumlahKursi > 20) {
      return { ok: false, message: "Jumlah kursi harus antara 1-20." };
    }

    await prisma.tamu.create({
      data: { eventId, nama, kategori, status, jumlahKursi, noWa, qrToken: generateToken() },
    });
    revalidatePath(`/klien/${eventId}/tamu`);
    revalidatePath(`/klien/${eventId}/rekap`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    return { ok: true, message: `Tamu "${nama}" berhasil ditambahkan. QR code otomatis dibuat.` };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function importTamuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    if (!(await assertEventAccess(session, eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const raw = String(formData.get("data") ?? "").trim();
    if (!raw) return { ok: false, message: "Data import kosong." };

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const tamuList: {
      eventId: number;
      nama: string;
      kategori: string;
      status: string;
      jumlahKursi: number;
      noWa: string | null;
      qrToken: string;
    }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[;,\t]/).map((p) => p.trim());
      const nama = parts[0] ?? "";
      if (!nama) {
        errors.push(`Baris ${i + 1}: nama kosong.`);
        continue;
      }
      const kategori = (parts[1] ?? "TEMAN").toUpperCase().replace(/-/g, "_");
      const status = (parts[2] ?? "REGULAR").toUpperCase();
      const jumlahKursi = parts[3] ? Number(parts[3]) : 1;
      const noWa = parts[4] || null;

      if (!VALID_KATEGORI.includes(kategori)) {
        errors.push(
          `Baris ${i + 1}: kategori "${parts[1]}" tidak valid (gunakan: KELUARGA_PRIA, KELUARGA_WANITA, TEMAN, KOLEGA).`,
        );
        continue;
      }
      if (!["VIP", "REGULAR"].includes(status)) {
        errors.push(`Baris ${i + 1}: status "${parts[2]}" tidak valid (gunakan VIP atau REGULAR).`);
        continue;
      }
      if (!Number.isFinite(jumlahKursi) || jumlahKursi < 1) {
        errors.push(`Baris ${i + 1}: jumlah kursi tidak valid.`);
        continue;
      }

      tamuList.push({
        eventId,
        nama,
        kategori,
        status,
        jumlahKursi: Math.min(jumlahKursi, 20),
        noWa,
        qrToken: generateToken(),
      });
    }

    if (tamuList.length > 0) {
      await prisma.tamu.createMany({ data: tamuList });
    }

    revalidatePath(`/klien/${eventId}/tamu`);
    revalidatePath(`/klien/${eventId}/rekap`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    if (errors.length > 0) {
      return {
        ok: tamuList.length > 0,
        message: `${tamuList.length} tamu diimpor, ${errors.length} baris gagal:\n${errors.slice(0, 5).join("\n")}`,
      };
    }
    return { ok: true, message: `${tamuList.length} tamu berhasil diimpor.` };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat import." };
  }
}

export async function updateTamuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const id = Number(formData.get("id"));
    const tamu = await prisma.tamu.findUnique({ where: { id } });
    if (!tamu) return { ok: false, message: "Tamu tidak ditemukan." };
    if (!(await assertEventAccess(session, tamu.eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const nama = String(formData.get("nama") ?? "").trim();
    const kategori = String(formData.get("kategori") ?? tamu.kategori);
    const status = String(formData.get("status") ?? tamu.status);
    const jumlahKursi = Number(formData.get("jumlahKursi") ?? tamu.jumlahKursi);
    const noWa = String(formData.get("noWa") ?? "").trim() || null;

    if (!nama) return { ok: false, message: "Nama tamu wajib diisi." };
    if (!VALID_KATEGORI.includes(kategori)) return { ok: false, message: "Kategori tidak valid." };
    if (!["VIP", "REGULAR"].includes(status)) return { ok: false, message: "Status tidak valid." };
    if (!Number.isFinite(jumlahKursi) || jumlahKursi < 1 || jumlahKursi > 20) {
      return { ok: false, message: "Jumlah kursi harus antara 1-20." };
    }

    await prisma.tamu.update({ where: { id }, data: { nama, kategori, status, jumlahKursi, noWa } });
    revalidatePath(`/klien/${tamu.eventId}/tamu`);
    revalidatePath(`/klien/${tamu.eventId}/rekap`);
    revalidatePath(`/events/${tamu.eventId}`);
    revalidatePath(`/events/${tamu.eventId}`, "page");
    return { ok: true, message: "Data tamu berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteTamuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const id = Number(formData.get("id"));
    const tamu = await prisma.tamu.findUnique({ where: { id } });
    if (!tamu) return { ok: false, message: "Tamu tidak ditemukan." };
    if (!(await assertEventAccess(session, tamu.eventId, { allowKlien: true }))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    await prisma.tamu.delete({ where: { id } });
    revalidatePath(`/klien/${tamu.eventId}/tamu`);
    revalidatePath(`/klien/${tamu.eventId}/rekap`);
    revalidatePath(`/events/${tamu.eventId}`);
    revalidatePath(`/events/${tamu.eventId}`, "page");
    return { ok: true, message: "Tamu dihapus. QR code terkait kini tidak valid." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menghapus." };
  }
}

/* ---------- RSVP (publik, tanpa login) ---------- */

export async function submitRsvpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const token = String(formData.get("token") ?? "").trim();
    const status = String(formData.get("status") ?? "");
    const jumlahHadir = Number(formData.get("jumlahHadir") ?? 1);

    if (!token) return { ok: false, message: "Token undangan tidak valid." };
    if (!["HADIR", "TIDAK"].includes(status)) {
      return { ok: false, message: "Pilih status kehadiran." };
    }

    const tamu = await prisma.tamu.findUnique({
      where: { qrToken: token },
      include: { event: true },
    });
    if (!tamu) return { ok: false, message: "Undangan tidak ditemukan." };
    if (tamu.event.status === "DIBATALKAN") {
      return { ok: false, message: "Acara ini telah dibatalkan." };
    }

    let jumlah = status === "TIDAK" ? 0 : jumlahHadir;
    if (!Number.isFinite(jumlah) || jumlah < 0) jumlah = 1;
    jumlah = Math.min(jumlah, tamu.jumlahKursi);

    await prisma.rsvp.upsert({
      where: { tamuId: tamu.id },
      create: { tamuId: tamu.id, status, jumlahHadir: jumlah },
      update: { status, jumlahHadir: jumlah },
    });

    revalidatePath(`/undangan/${token}`);
    return {
      ok: true,
      message:
        status === "TIDAK"
          ? "Terima kasih. Konfirmasi tidak hadir telah dicatat."
          : `Terima kasih, ${tamu.nama}! Konfirmasi kehadiran (${jumlah} orang) telah dicatat.`,
    };
  } catch {
    return { ok: false, message: "Terjadi kesalahan. Coba lagi." };
  }
}

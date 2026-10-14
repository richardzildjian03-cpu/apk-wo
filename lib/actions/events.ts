"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, requireInternal, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import type { Event } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function getEventForUser(
  session: SessionUser,
  eventId: number,
): Promise<Event | null> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (session.role === ROLES.LEADER && event.leaderId !== session.id) return null;
  return event;
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const namaAcara = String(formData.get("namaAcara") ?? "").trim();
    const lokasi = String(formData.get("lokasi") ?? "").trim();
    const tanggalRaw = String(formData.get("tanggal") ?? "");
    const status = String(formData.get("status") ?? "AKTIF");

    let klienId = Number(formData.get("klienId") ?? 0);
    const klienBaruNama = String(formData.get("klienBaruNama") ?? "").trim();
    const klienBaruEmail = String(formData.get("klienBaruEmail") ?? "").trim().toLowerCase();
    const klienBaruNoHp = String(formData.get("klienBaruNoHp") ?? "").trim() || null;
    const klienBaruPassword = String(formData.get("klienBaruPassword") ?? "password123").trim();

    const paketIdRaw = String(formData.get("paketId") ?? "").trim();
    const paketId = paketIdRaw ? Number(paketIdRaw) : null;
    const leaderIdRaw = String(formData.get("leaderId") ?? "").trim();
    const leaderId = leaderIdRaw ? Number(leaderIdRaw) : null;

    if (!namaAcara || !lokasi || !tanggalRaw) {
      return { ok: false, message: "Nama acara, tanggal, dan lokasi wajib diisi." };
    }
    const tanggal = new Date(tanggalRaw);
    if (isNaN(tanggal.getTime())) {
      return { ok: false, message: "Tanggal tidak valid." };
    }

    if (!klienId && klienBaruNama && klienBaruEmail) {
      const exists = await prisma.user.findUnique({ where: { email: klienBaruEmail } });
      if (exists) {
        return {
          ok: false,
          message: `Email klien ${klienBaruEmail} sudah terdaftar — pilih akun tersebut pada daftar klien.`,
        };
      }
      const klien = await prisma.user.create({
        data: {
          nama: klienBaruNama,
          email: klienBaruEmail,
          passwordHash: hashPassword(klienBaruPassword || "password123"),
          role: "KLIEN",
          noHp: klienBaruNoHp,
        },
      });
      klienId = klien.id;
    }

    if (!klienId) {
      return { ok: false, message: "Pilih klien yang ada atau isi data klien baru." };
    }

    if (leaderId) {
      const clash = await prisma.event.findFirst({
        where: {
          leaderId,
          tanggal: {
            gte: new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate()),
            lt: new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate() + 1),
          },
          status: { in: ["DRAFT", "AKTIF"] },
        },
      });
      if (clash) {
        return {
          ok: false,
          message: `Peringatan double-booking: leader ini sudah mengampu "${clash.namaAcara}" pada tanggal yang sama.`,
        };
      }
    }

    await prisma.event.create({
      data: { namaAcara, klienId, paketId, leaderId, tanggal, lokasi, status },
    });
    revalidatePath("/events");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: `Event "${namaAcara}" berhasil dibuat. Silakan lengkapi data pada halaman Event.`,
    };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updateEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const id = Number(formData.get("id"));
    const event = await getEventForUser(session, id);
    if (!event) return { ok: false, message: "Event tidak ditemukan atau tidak punya akses." };

    const namaAcara = String(formData.get("namaAcara") ?? "").trim();
    const lokasi = String(formData.get("lokasi") ?? "").trim();
    const tanggalRaw = String(formData.get("tanggal") ?? "");
    const status = String(formData.get("status") ?? event.status);
    const paketIdRaw = String(formData.get("paketId") ?? "").trim();
    const paketId = paketIdRaw ? Number(paketIdRaw) : null;
    const leaderIdRaw = String(formData.get("leaderId") ?? "").trim();
    const leaderId = leaderIdRaw ? Number(leaderIdRaw) : null;

    if (!namaAcara || !lokasi || !tanggalRaw) {
      return { ok: false, message: "Nama acara, tanggal, dan lokasi wajib diisi." };
    }
    const tanggal = new Date(tanggalRaw);
    if (isNaN(tanggal.getTime())) return { ok: false, message: "Tanggal tidak valid." };

    await prisma.event.update({
      where: { id },
      data: { namaAcara, lokasi, tanggal, status, paketId, leaderId },
    });
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, message: "Event berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, message: "ID tidak valid." };

    await prisma.event.delete({ where: { id } });
    revalidatePath("/events");
    revalidatePath("/dashboard");
    return { ok: true, message: "Event dan seluruh datanya berhasil dihapus." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menghapus." };
  }
}

export async function addRundownAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const eventId = Number(formData.get("eventId"));
    const event = await getEventForUser(session, eventId);
    if (!event) return { ok: false, message: "Tidak punya akses ke event ini." };

    const waktu = String(formData.get("waktu") ?? "").trim();
    const kegiatan = String(formData.get("kegiatan") ?? "").trim();
    const pic = String(formData.get("pic") ?? "").trim() || null;
    if (!waktu || !kegiatan) {
      return { ok: false, message: "Waktu dan kegiatan wajib diisi." };
    }

    await prisma.rundown.create({ data: { eventId, waktu, kegiatan, pic } });
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    return { ok: true, message: "Item rundown berhasil ditambahkan." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function deleteRundownAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const id = Number(formData.get("id"));
    const item = await prisma.rundown.findUnique({ where: { id } });
    if (!item) return { ok: false, message: "Item rundown tidak ditemukan." };

    const event = await getEventForUser(session, item.eventId);
    if (!event) return { ok: false, message: "Tidak punya akses ke event ini." };

    await prisma.rundown.delete({ where: { id } });
    revalidatePath(`/events/${item.eventId}`);
    revalidatePath(`/events/${item.eventId}`, "page");
    return { ok: true, message: "Item rundown dihapus." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menghapus." };
  }
}

export async function assignVendorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const eventId = Number(formData.get("eventId"));
    const vendorId = Number(formData.get("vendorId"));
    const event = await getEventForUser(session, eventId);
    if (!event) return { ok: false, message: "Tidak punya akses ke event ini." };
    if (!vendorId) return { ok: false, message: "Pilih vendor terlebih dahulu." };

    const exists = await prisma.penugasanVendor.findFirst({ where: { eventId, vendorId } });
    if (exists) return { ok: false, message: "Vendor sudah ditugaskan ke event ini." };

    await prisma.penugasanVendor.create({ data: { eventId, vendorId } });
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");
    return { ok: true, message: "Vendor berhasil ditugaskan." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updatePenugasanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const id = Number(formData.get("id"));
    const statusKonfirmasi = String(formData.get("statusKonfirmasi") ?? "");
    const penugasan = await prisma.penugasanVendor.findUnique({ where: { id } });
    if (!penugasan) return { ok: false, message: "Penugasan tidak ditemukan." };

    const event = await getEventForUser(session, penugasan.eventId);
    if (!event) return { ok: false, message: "Tidak punya akses ke event ini." };

    if (!["MENUNGGU", "DIKONFIRMASI", "DITOLAK"].includes(statusKonfirmasi)) {
      return { ok: false, message: "Status tidak valid." };
    }

    await prisma.penugasanVendor.update({ where: { id }, data: { statusKonfirmasi } });
    revalidatePath(`/events/${penugasan.eventId}`);
    revalidatePath(`/events/${penugasan.eventId}`, "page");
    return { ok: true, message: "Status konfirmasi vendor diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function removePenugasanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const id = Number(formData.get("id"));
    const penugasan = await prisma.penugasanVendor.findUnique({ where: { id } });
    if (!penugasan) return { ok: false, message: "Penugasan tidak ditemukan." };

    const event = await getEventForUser(session, penugasan.eventId);
    if (!event) return { ok: false, message: "Tidak punya akses ke event ini." };

    await prisma.penugasanVendor.delete({ where: { id } });
    revalidatePath(`/events/${penugasan.eventId}`);
    revalidatePath(`/events/${penugasan.eventId}`, "page");
    return { ok: true, message: "Penugasan vendor dihapus." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menghapus." };
  }
}

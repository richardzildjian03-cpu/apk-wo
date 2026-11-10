"use server";

import { prisma } from "@/lib/prisma";
import { generateToken, requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { MODE_QR, MODE_QR_LABELS } from "@/lib/qrmode";
import type { ActionState } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertEventManage(session: SessionUser, eventId: number): Promise<boolean> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (session.role === ROLES.BOS || session.role === ROLES.STAFF) return true;
  if (session.role === ROLES.LEADER) return event.leaderId === session.id;
  if (session.role === ROLES.KLIEN) return event.klienId === session.id;
  return false;
}

/** Ganti mode QR untuk sebuah event. Token acara dibuat otomatis bila belum ada. */
export async function setModeQrAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    const mode = String(formData.get("modeQr") ?? "");

    if (!(await assertEventManage(session, eventId))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }
    if (mode !== MODE_QR.PER_TAMU && mode !== MODE_QR.SATU_QR) {
      return { ok: false, message: "Mode QR tidak valid." };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { ok: false, message: "Event tidak ditemukan." };

    await prisma.event.update({
      where: { id: eventId },
      data: {
        modeQr: mode,
        eventToken: event.eventToken ?? generateToken(),
      },
    });

    revalidatePath(`/klien/${eventId}/tamu`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");

    return {
      ok: true,
      message: `Mode QR diubah ke "${MODE_QR_LABELS[mode]}".`,
    };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat mengubah mode QR." };
  }
}

/** Regenerasi token acara — QR lama langsung tidak berlaku. */
export async function regenerateEventTokenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  try {
    const eventId = Number(formData.get("eventId"));
    if (!(await assertEventManage(session, eventId))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { eventToken: generateToken() },
    });

    revalidatePath(`/klien/${eventId}/tamu`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}`, "page");

    return {
      ok: true,
      message: "QR master diperbarui. QR lama tidak berlaku lagi — bagikan ulang QR baru.",
    };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat memperbarui QR." };
  }
}

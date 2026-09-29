"use server";

import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";

export async function revertCheckInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInternal();

  try {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, message: "ID tidak valid." };

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: { tamu: true },
    });
    if (!checkIn) return { ok: false, message: "Data check-in tidak ditemukan." };

    const event = await prisma.event.findUnique({
      where: { id: checkIn.tamu.eventId },
    });
    if (!event) return { ok: false, message: "Event tidak ditemukan." };
    if (session.role === ROLES.LEADER && event.leaderId !== session.id) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    await prisma.checkIn.delete({ where: { id } });
    revalidatePath(`/events/${event.id}/checkin`);
    revalidatePath(`/events/${event.id}`);
    return {
      ok: true,
      message: `Check-in ${checkIn.tamu.nama} dibatalkan. Tamu dapat check-in ulang.`,
    };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat membatalkan check-in." };
  }
}

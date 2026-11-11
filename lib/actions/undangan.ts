"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveUndanganFile, deleteUndanganFile } from "@/lib/uploads";

async function assertEventAccess(session: SessionUser, eventId: number): Promise<boolean> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (session.role === ROLES.BOS || session.role === ROLES.STAFF) return true;
  if (session.role === ROLES.LEADER) return event.leaderId === session.id;
  if (session.role === ROLES.KLIEN) return event.klienId === session.id;
  return false;
}

function revalidateEvent(eventId: number) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/klien/${eventId}`);
  revalidatePath(`/klien/${eventId}/tamu`);
}

/**
 * Atur undangan digital eksternal untuk sebuah event.
 * Mode:
 *  - BAWAAN : kembali memakai undangan bawaan aplikasi (hapus link/file)
 *  - LINK   : client/vendor sudah punya undangan berupa tautan
 *  - FILE   : client mengunggah file undangan (PDF/JPG/PNG/WebP)
 */
export async function saveUndanganAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  if (!session) return { ok: false, message: "Sesi berakhir. Silakan masuk kembali." };

  try {
    const eventId = Number(formData.get("eventId"));
    if (!Number.isFinite(eventId)) return { ok: false, message: "Event tidak valid." };
    if (!(await assertEventAccess(session, eventId))) {
      return { ok: false, message: "Tidak punya akses ke event ini." };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { ok: false, message: "Event tidak ditemukan." };

    const mode = String(formData.get("mode") ?? "BAWAAN").toUpperCase();

    if (mode === "BAWAAN") {
      await deleteUndanganFile(event.undanganFile);
      await prisma.event.update({
        where: { id: eventId },
        data: { undanganTipe: null, undanganUrl: null, undanganFile: null, undanganNama: null },
      });
      revalidateEvent(eventId);
      return {
        ok: true,
        message: "Undangan eksternal dihapus. Undangan bawaan aplikasi kembali dipakai.",
      };
    }

    if (mode === "LINK") {
      const raw = String(formData.get("url") ?? "").trim();
      if (!raw) return { ok: false, message: "Tempel link undangan terlebih dahulu." };

      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        return { ok: false, message: "Link tidak valid. Contoh: https://undangan.example.com/bagas-dewi" };
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, message: "Link harus diawali http:// atau https://" };
      }

      await deleteUndanganFile(event.undanganFile);
      await prisma.event.update({
        where: { id: eventId },
        data: {
          undanganTipe: "LINK",
          undanganUrl: parsed.toString(),
          undanganFile: null,
          undanganNama: null,
        },
      });
      revalidateEvent(eventId);
      return { ok: true, message: "Link undangan berhasil disimpan." };
    }

    if (mode === "FILE") {
      const uploaded = formData.get("file");
      const hasFile = uploaded instanceof File && uploaded.size > 0;

      if (!hasFile && !event.undanganFile) {
        return { ok: false, message: "Pilih file undangan (PDF/JPG/PNG/WebP, maks 10MB)." };
      }

      let publicPath = event.undanganFile;
      let namaFile = event.undanganNama;

      if (hasFile) {
        const result = await saveUndanganFile(uploaded);
        if (!result.ok) return { ok: false, message: result.error };
        if (event.undanganFile) await deleteUndanganFile(event.undanganFile);
        publicPath = result.publicPath;
        namaFile = uploaded.name;
      }

      await prisma.event.update({
        where: { id: eventId },
        data: {
          undanganTipe: "FILE",
          undanganUrl: null,
          undanganFile: publicPath,
          undanganNama: namaFile,
        },
      });
      revalidateEvent(eventId);
      return { ok: true, message: "File undangan berhasil disimpan." };
    }

    return { ok: false, message: "Pilihan sumber undangan tidak valid." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan undangan." };
  }
}

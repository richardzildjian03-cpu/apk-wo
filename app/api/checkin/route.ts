import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLES, RSVP_LABELS } from "@/lib/constants";

type CheckinResponse = {
  ok: boolean;
  duplicate: boolean;
  autoRsvp?: boolean;
  nama?: string;
  status?: string;
  jumlahKursi?: number;
  rsvpLabel?: string;
  waktu?: string;
  message: string;
};

function extractToken(raw: string): string {
  let token = raw.trim();
  if (token.includes("/undangan/")) {
    token = token.split("/undangan/")[1] ?? "";
    token = token.split(/[?#]/)[0];
  }
  return token.trim();
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "Sesi berakhir. Silakan login ulang." },
      { status: 401 },
    );
  }
  if (session.role === ROLES.KLIEN) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "Tidak punya akses." },
      { status: 403 },
    );
  }

  let body: { token?: unknown; eventId?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const token = extractToken(String(body?.token ?? ""));
  const eventId = Number(body?.eventId);

  if (!token || !Number.isFinite(eventId) || eventId <= 0) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "QR / token tidak valid." },
      { status: 400 },
    );
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "Event tidak ditemukan." },
      { status: 404 },
    );
  }
  if (session.role === ROLES.LEADER && event.leaderId !== session.id) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "Tidak punya akses ke event ini." },
      { status: 403 },
    );
  }
  if (event.status === "DIBATALKAN") {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "Event ini telah dibatalkan." },
      { status: 400 },
    );
  }

  const tamu = await prisma.tamu.findUnique({
    where: { qrToken: token },
    include: { rsvp: true, checkIn: true },
  });
  if (!tamu || tamu.eventId !== eventId) {
    return NextResponse.json<CheckinResponse>(
      { ok: false, duplicate: false, message: "QR tidak dikenali atau bukan untuk event ini." },
      { status: 404 },
    );
  }

  const base = {
    nama: tamu.nama,
    status: tamu.status,
    jumlahKursi: tamu.jumlahKursi,
    rsvpLabel: tamu.rsvp
      ? `${RSVP_LABELS[tamu.rsvp.status] ?? tamu.rsvp.status}${
          tamu.rsvp.status === "HADIR" ? ` (${tamu.rsvp.jumlahHadir} org)` : ""
        }`
      : "Belum menjawab",
  };

  if (tamu.checkIn) {
    return NextResponse.json<CheckinResponse>({
      ok: false,
      duplicate: true,
      ...base,
      waktu: tamu.checkIn.waktuCheckIn.toISOString(),
      message: `${tamu.nama} sudah check-in sebelumnya.`,
    });
  }

  const checkIn = await prisma.checkIn.create({
    data: { tamuId: tamu.id, petugasId: session.id },
  });

  // Auto-RSVP: scan QR check-in = tamu otomatis tercatat HADIR
  let autoRsvp = false;
  if (!tamu.rsvp || tamu.rsvp.status !== "HADIR") {
    await prisma.rsvp.upsert({
      where: { tamuId: tamu.id },
      create: { tamuId: tamu.id, status: "HADIR", jumlahHadir: tamu.jumlahKursi },
      update: { status: "HADIR", jumlahHadir: tamu.jumlahKursi },
    });
    autoRsvp = true;
  }

  return NextResponse.json<CheckinResponse>({
    ok: true,
    duplicate: false,
    ...base,
    ...(autoRsvp ? { rsvpLabel: `Hadir (${tamu.jumlahKursi} org) — otomatis dari check-in` } : {}),
    autoRsvp,
    waktu: checkIn.waktuCheckIn.toISOString(),
    message:
      autoRsvp
        ? `${tamu.nama} berhasil check-in — RSVP otomatis dicatat: HADIR.`
        : `${tamu.nama} berhasil check-in.`,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RSVP_LABELS } from "@/lib/constants";

// Rate limit sederhana in-memory: maks 20 submit / menit / IP.
// Cukup untuk mencegah spam di hari-H tanpa perlu Redis.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // jaga memori
  return arr.length > MAX_HITS;
}

export type SelfCheckinResponse = {
  ok: boolean;
  duplicate?: boolean;
  nama?: string;
  status?: string;
  jumlahKursi?: number;
  rsvpLabel?: string;
  waktu?: string;
  message: string;
};

/** Cari tamu berdasarkan nama (case-insensitive) dalam satu event. */
async function findTamuByName(eventId: number, nama: string) {
  const exact = await prisma.tamu.findFirst({
    where: { eventId, nama: { equals: nama } },
    include: { rsvp: true, checkIn: true },
  });
  if (exact) return exact;

  // Fallback: pencocokan longgar (spasi ganda / beda huruf besar-kecil).
  const all = await prisma.tamu.findMany({
    where: { eventId },
    include: { rsvp: true, checkIn: true },
  });
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const target = norm(nama);
  return all.find((t) => norm(t.nama) === target) ?? null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json<SelfCheckinResponse>(
      { ok: false, message: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." },
      { status: 429 },
    );
  }

  let body: { eventToken?: unknown; nama?: unknown; jumlah?: unknown; keterangan?: unknown } | null =
    null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const eventToken = String(body?.eventToken ?? "").trim();
  const nama = String(body?.nama ?? "").trim();
  const jumlahRaw = Number(body?.jumlah ?? 1);
  const keterangan = String(body?.keterangan ?? "").trim() || null;

  if (!eventToken || !nama) {
    return NextResponse.json<SelfCheckinResponse>(
      { ok: false, message: "Nama wajib diisi." },
      { status: 400 },
    );
  }
  if (nama.length > 120) {
    return NextResponse.json<SelfCheckinResponse>(
      { ok: false, message: "Nama terlalu panjang." },
      { status: 400 },
    );
  }

  const event = await prisma.event.findUnique({ where: { eventToken } });
  if (!event) {
    return NextResponse.json<SelfCheckinResponse>(
      { ok: false, message: "QR tidak dikenali. Pastikan Anda scan QR yang benar." },
      { status: 404 },
    );
  }
  if (event.status === "DIBATALKAN") {
    return NextResponse.json<SelfCheckinResponse>(
      { ok: false, message: "Acara ini telah dibatalkan." },
      { status: 400 },
    );
  }

  const jumlah = Number.isFinite(jumlahRaw) ? Math.min(Math.max(Math.round(jumlahRaw), 1), 20) : 1;

  const tamu = await findTamuByName(event.id, nama);

  // --- Tamu terdaftar ---
  if (tamu) {
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
      return NextResponse.json<SelfCheckinResponse>({
        ok: false,
        duplicate: true,
        ...base,
        waktu: tamu.checkIn.waktuCheckIn.toISOString(),
        message: `${tamu.nama} sudah tercatat hadir sebelumnya.`,
      });
    }

    const checkIn = await prisma.checkIn.create({
      data: { tamuId: tamu.id, petugasId: null, sumber: "MANDIRI" },
    });

    let autoRsvp = false;
    if (!tamu.rsvp || tamu.rsvp.status !== "HADIR") {
      await prisma.rsvp.upsert({
        where: { tamuId: tamu.id },
        create: { tamuId: tamu.id, status: "HADIR", jumlahHadir: tamu.jumlahKursi },
        update: { status: "HADIR", jumlahHadir: tamu.jumlahKursi },
      });
      autoRsvp = true;
    }

    return NextResponse.json<SelfCheckinResponse>({
      ok: true,
      duplicate: false,
      ...base,
      ...(autoRsvp ? { rsvpLabel: `Hadir (${tamu.jumlahKursi} org) — otomatis dari check-in` } : {}),
      waktu: checkIn.waktuCheckIn.toISOString(),
      message: `Terima kasih, ${tamu.nama}! Kehadiran Anda sudah tercatat.`,
    });
  }

  // --- Tamu tidak terdaftar (walk-in) ---
  const walkIn = await prisma.walkIn.create({
    data: { eventId: event.id, nama, jumlah, keterangan },
  });

  return NextResponse.json<SelfCheckinResponse>({
    ok: true,
    duplicate: false,
    nama: walkIn.nama,
    status: "REGULAR",
    jumlahKursi: walkIn.jumlah,
    rsvpLabel: "Walk-in",
    waktu: walkIn.createdAt.toISOString(),
    message: `Terima kasih, ${walkIn.nama}! Kehadiran Anda tercatat sebagai tamu tambahan.`,
  });
}

/** GET: daftar nama tamu untuk autocomplete di halaman self check-in. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("event")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, tamu: [] }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { eventToken: token },
    select: { id: true, namaAcara: true, status: true },
  });
  if (!event) {
    return NextResponse.json({ ok: false, tamu: [] }, { status: 404 });
  }

  const tamu = await prisma.tamu.findMany({
    where: { eventId: event.id },
    select: { nama: true, status: true, jumlahKursi: true, checkIn: { select: { id: true } } },
    orderBy: { nama: "asc" },
  });

  return NextResponse.json({
    ok: true,
    acara: event.namaAcara,
    tamu: tamu.map((t) => ({
      nama: t.nama,
      status: t.status,
      jumlahKursi: t.jumlahKursi,
      sudahHadir: Boolean(t.checkIn),
    })),
  });
}

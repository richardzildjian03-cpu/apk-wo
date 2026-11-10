import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLES, KATEGORI_LABELS, RSVP_LABELS } from "@/lib/constants";

function csvEscape(value: string): string {
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { eventId } = await params;
  const id = Number(eventId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID event tidak valid" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tamu: { include: { rsvp: true, checkIn: true }, orderBy: { nama: "asc" } },
      pengantin: true,
      walkIns: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  }

  const allowed =
    session.role === ROLES.BOS ||
    session.role === ROLES.STAFF ||
    (session.role === ROLES.LEADER && event.leaderId === session.id) ||
    (session.role === ROLES.KLIEN && event.klienId === session.id);
  if (!allowed) {
    return NextResponse.json({ error: "Tidak punya akses" }, { status: 403 });
  }

  const header = [
    "No",
    "Nama Tamu",
    "Kategori",
    "Status Tamu",
    "Jumlah Kursi",
    "No WA",
    "Konfirmasi (RSVP)",
    "Jumlah Hadir",
    "RSVP Diperbarui",
    "Waktu Check-in",
    "Sumber Check-in",
  ];

  const rows = event.tamu.map((t, i) => [
    String(i + 1),
    t.nama,
    KATEGORI_LABELS[t.kategori] ?? t.kategori,
    t.status === "VIP" ? "VIP" : "Regular",
    String(t.jumlahKursi),
    t.noWa ?? "",
    t.rsvp ? (RSVP_LABELS[t.rsvp.status] ?? t.rsvp.status) : "Belum Menjawab",
    t.rsvp?.status === "HADIR" ? String(t.rsvp.jumlahHadir) : "",
    t.rsvp
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(t.rsvp.updatedAt)
      : "",
    t.checkIn
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
          t.checkIn.waktuCheckIn,
        )
      : "",
    t.checkIn ? (t.checkIn.sumber === "MANDIRI" ? "Mandiri (tamu)" : "Petugas") : "",
  ]);

  const totalTamu = event.tamu.length;
  const hadir = event.tamu.filter((t) => t.rsvp?.status === "HADIR");
  const totalOrangHadir = hadir.reduce((s, t) => s + (t.rsvp?.jumlahHadir ?? 0), 0);
  const vipHadir = hadir.filter((t) => t.status === "VIP").length;
  const checkedIn = event.tamu.filter((t) => t.checkIn);
  const checkInMandiri = checkedIn.filter((t) => t.checkIn!.sumber === "MANDIRI").length;
  const walkInOrang = event.walkIns.reduce((s, w) => s + w.jumlah, 0);

  const walkInBlock =
    event.walkIns.length > 0
      ? [
          [],
          ["Tamu Tambahan / Walk-in"],
          ["No", "Nama", "Jumlah Orang", "Keterangan", "Waktu"],
          ...event.walkIns.map((w, i) => [
            String(i + 1),
            w.nama,
            String(w.jumlah),
            w.keterangan ?? "",
            new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(w.createdAt),
          ]),
        ]
      : [];

  const summary = [
    [],
    ["Ringkasan"],
    ["Nama Acara", event.namaAcara],
    ["Tanggal", new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(event.tanggal)],
    ["Lokasi", event.lokasi],
    ["Mode QR", event.modeQr === "SATU_QR" ? "1 QR untuk Semua Tamu" : "1 Tamu 1 QR"],
    ["Total Tamu Terdaftar", String(totalTamu)],
    ["Konfirmasi Hadir", `${hadir.length} tamu (${totalOrangHadir} orang)`],
    ["VIP Hadir", String(vipHadir)],
    ["Tidak Hadir", String(event.tamu.filter((t) => t.rsvp?.status === "TIDAK").length)],
    ["Belum Menjawab", String(event.tamu.filter((t) => !t.rsvp).length)],
    ["Sudah Check-in", `${checkedIn.length} tamu (${checkInMandiri} mandiri)`],
    ["Tamu Tambahan (Walk-in)", `${event.walkIns.length} isian (${walkInOrang} orang)`],
  ];

  const csv =
    "\uFEFF" +
    [...summary, [], header, ...rows, ...walkInBlock]
      .map((row) => row.map(csvEscape).join(";"))
      .join("\r\n");

  const filename = `rekap-kehadiran-${event.namaAcara.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

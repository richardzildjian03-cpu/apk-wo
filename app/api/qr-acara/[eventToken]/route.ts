import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { baseUrlFromHeaders } from "@/lib/base-url";

/**
 * QR master untuk mode SATU_QR.
 * Mengarah ke halaman self check-in tamu: /checkin/[eventToken]
 *
 * Query opsional:
 *   ?ukuran=320|640|1024  — lebar PNG dalam px (default 640)
 *   ?unduh=1              — paksa download (Content-Disposition)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventToken: string }> },
) {
  const { eventToken } = await params;
  const url = new URL(request.url);

  const event = await prisma.event.findUnique({
    where: { eventToken },
    select: { namaAcara: true },
  });
  if (!event) {
    return NextResponse.json({ error: "QR tidak ditemukan." }, { status: 404 });
  }

  const sizeRaw = Number(url.searchParams.get("ukuran") ?? 640);
  const size = Number.isFinite(sizeRaw) ? Math.min(Math.max(Math.round(sizeRaw), 160), 1600) : 640;

  const target = `${baseUrlFromHeaders(request.headers)}/checkin/${eventToken}`;

  const png = await QRCode.toBuffer(target, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#be185d", light: "#ffffff" },
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=300",
  };

  if (url.searchParams.get("unduh") === "1") {
    const aman = event.namaAcara.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    headers["Content-Disposition"] = `attachment; filename="qr-checkin-${aman || "acara"}.png"`;
  }

  return new NextResponse(new Uint8Array(png), { headers });
}

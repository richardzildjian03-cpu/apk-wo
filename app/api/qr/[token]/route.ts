import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  const targetUrl = `${origin}/undangan/${token}`;

  const png = await QRCode.toBuffer(targetUrl, {
    width: 320,
    margin: 2,
    color: { dark: "#3f3f46", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

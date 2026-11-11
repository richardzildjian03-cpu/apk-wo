import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

// Next.js hanya menyajikan isi public/ yang ada saat build.
// Foto paket & logo di-upload setelah aplikasi jalan, jadi harus disajikan
// lewat route ini agar tetap bisa dibuka di server produksi (VPS).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (!segments?.length) return notFound();

  const filePath = path.join(UPLOAD_ROOT, ...segments);

  // Cegah path traversal (mis. /uploads/../../.env).
  const relative = path.relative(UPLOAD_ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return notFound();

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) return notFound();

  // Jangan pernah menyajikan file tersembunyi.
  if (segments.some((s) => s.startsWith("."))) return notFound();

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return notFound();

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}

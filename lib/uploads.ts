import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "paket");

export type UploadResult =
  | { ok: true; publicPath: string }
  | { ok: false; error: string };

export async function savePaketImage(file: File): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "File kosong." };
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Ukuran gambar maksimal 4MB." };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: "Format gambar harus JPG, PNG, atau WebP." };
  }

  const filename = `paket-${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return { ok: true, publicPath: `/uploads/paket/${filename}` };
}

export async function deletePaketImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/paket/")) return;
  const filename = path.basename(publicPath);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    /* file sudah tidak ada — abaikan */
  }
}

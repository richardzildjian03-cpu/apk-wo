type HeaderLike = { get(name: string): string | null };

function firstValue(value: string | null): string {
  return (value ?? "").split(",")[0]!.trim();
}

function isLocalHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  );
}

function withProtocol(raw: string): string {
  const value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return value.replace(/\/+$/, "");
}

/**
 * URL publik aplikasi — dipakai untuk tautan & QR yang akan dibuka di
 * perangkat lain (HP tamu/petugas).
 *
 * Kenapa tidak cukup header Host? Saat aplikasi dijalankan di balik tunnel
 * (Cloudflare Tunnel, ngrok) atau reverse proxy, header Host bisa ditulis
 * ulang menjadi alamat internal (localhost), sehingga QR berisi alamat yang
 * tidak bisa dibuka HP. Karena itu `APP_URL` didahulukan.
 *
 * Urutan prioritas:
 *   1. APP_URL / NEXT_PUBLIC_APP_URL  (mis. https://xxx.trycloudflare.com)
 *   2. X-Forwarded-Host + X-Forwarded-Proto
 *   3. Header Host (akses langsung / localhost)
 */
export function baseUrlFromHeaders(headers: HeaderLike): string {
  const env = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (env) return withProtocol(env);

  const forwardedHost = firstValue(headers.get("x-forwarded-host"));
  const host = forwardedHost || firstValue(headers.get("host"));
  if (!host) return "";

  const proto =
    firstValue(headers.get("x-forwarded-proto")) || (isLocalHost(host) ? "http" : "https");

  return `${proto}://${host}`;
}

import Link from "next/link";

/**
 * Logo + nama aplikasi untuk sidebar/header.
 *
 * Merapikan tampilan: logo selalu berada dalam kotak putih dengan sudut
 * membulat dan ring tipis (agar terbaca di atas gradasi pink), nama memakai
 * font tegas, dan keterangan peran opsional di bawahnya. Bila logo belum
 * diunggah, dipakai lencana huruf awal agar tata letak tetap stabil.
 */
export function BrandLogo({
  siteName,
  logoPath,
  subtitle,
  href = "/",
  size = "md",
  onDark = true,
  className = "",
}: {
  siteName: string;
  logoPath?: string | null;
  subtitle?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  className?: string;
}) {
  const box =
    size === "lg"
      ? "h-12 w-12 text-xl"
      : size === "sm"
        ? "h-9 w-9 text-sm"
        : "h-11 w-11 text-lg";
  const title =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const initials = (siteName || "DL")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = (
    <>
      <span
        className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${
          onDark ? "ring-white/30" : "ring-zinc-200"
        }`}
      >
        {logoPath ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={logoPath} alt={siteName} className="h-full w-full object-contain" />
        ) : (
          <span
            className={`grid h-full w-full place-items-center font-bold ${
              onDark ? "bg-emerald-600 text-white" : "bg-pink-100 text-pink-700"
            }`}
          >
            {initials}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate font-semibold tracking-tight ${title} ${
            onDark ? "text-white" : "text-zinc-900"
          }`}
        >
          {siteName}
        </span>
        {subtitle ? (
          <span
            className={`mt-0.5 block truncate text-[10px] font-semibold tracking-[0.18em] uppercase ${
              onDark ? "text-emerald-200" : "text-zinc-500"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <Link href={href} className={`flex min-w-0 items-center gap-3 ${className}`}>
      {inner}
    </Link>
  );
}

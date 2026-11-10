import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card">
      {title || action ? (
        <div className="card-header flex items-center justify-between gap-3">
          <h2 className="card-title">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="card-body">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  variant = "zinc",
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "pink" | "green" | "violet" | "zinc";
}) {
  const box =
    variant === "pink"
      ? "stat-pink"
      : variant === "green"
        ? "stat-green"
        : variant === "violet"
          ? "stat-violet"
          : "stat-zinc";
  const valueColor =
    variant === "pink"
      ? "text-pink-700"
      : variant === "green"
        ? "text-emerald-800"
        : variant === "violet"
          ? "text-violet-700"
          : "text-zinc-900";
  return (
    <div className={box}>
      <div className="px-5 py-4">
        <p className="text-sm text-zinc-600">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Badge({
  variant = "zinc",
  children,
}: {
  variant?: "pink" | "green" | "zinc" | "amber" | "red" | "violet";
  children: ReactNode;
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function EventStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "pink" | "green" | "zinc" | "amber" | "red"; label: string }> = {
    DRAFT: { variant: "zinc", label: "Draft" },
    AKTIF: { variant: "pink", label: "Aktif" },
    SELESAI: { variant: "green", label: "Selesai" },
    DIBATALKAN: { variant: "red", label: "Dibatalkan" },
  };
  const cfg = map[status] ?? { variant: "zinc" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function RsvpBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="zinc">Belum Menjawab</Badge>;
  if (status === "HADIR") return <Badge variant="green">Hadir</Badge>;
  if (status === "TIDAK") return <Badge variant="red">Tidak Hadir</Badge>;
  return <Badge variant="amber">{status}</Badge>;
}

export function TamuStatusBadge({ status }: { status: string }) {
  return status === "VIP" ? (
    <Badge variant="violet">VIP</Badge>
  ) : (
    <Badge variant="zinc">Regular</Badge>
  );
}

export function KonfirmasiBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "amber" | "green" | "red"; label: string }> = {
    MENUNGGU: { variant: "amber", label: "Menunggu" },
    DIKONFIRMASI: { variant: "green", label: "Dikonfirmasi" },
    DITOLAK: { variant: "red", label: "Ditolak" },
  };
  const cfg = map[status] ?? { variant: "amber" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-pink-300 bg-pink-50/50 px-4 py-10 text-center text-sm text-pink-700">
      {message}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  basePath,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  basePath: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((t) =>
        t.key === active ? (
          <span
            key={t.key}
            className="cursor-pointer rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white"
          >
            {t.label}
          </span>
        ) : (
          <Link
            key={t.key}
            href={`${basePath}?tab=${t.key}`}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t.label}
          </Link>
        ),
      )}
    </div>
  );
}

/* ---------- Loading skeletons ---------- */
/* Dipakai oleh loading.tsx di tiap route supaya navigasi terasa instan —
   kerangka tampil < 1 frame, data menyusul tanpa layar putih. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-zinc">
          <div className="space-y-2 px-5 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-pink-50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? "w-40" : c === cols - 1 ? "ml-auto w-16" : "w-24"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

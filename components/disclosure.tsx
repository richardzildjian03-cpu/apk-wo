"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Panel yang bisa dibuka/tutup.
 *
 * Menggantikan <details>/<summary> karena <summary> yang diberi padding,
 * border, dan background (untuk gaya card-header) kehilangan area kliknya
 * di banyak browser — tombol tampak normal tapi tidak merespons klik.
 *
 * Pakai <button> asli sehingga area klik selalu akurat dan bisa diakses
 * keyboard/screen reader.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  tone = "pink",
  className = "",
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "pink" | "zinc" | "green";
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;

  const headerClass =
    tone === "green" ? "card-header-green" : tone === "zinc" ? "card-header-zinc" : "card-header";

  const iconClass = tone === "green" ? "text-white" : tone === "zinc" ? "text-zinc-600" : "text-pink-600";

  return (
    <div className={`card ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${headerClass} flex w-full cursor-pointer items-center justify-between gap-3 text-left transition hover:brightness-[0.98]`}
      >
        <span className="min-w-0 flex-1">{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${iconClass} shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div id={panelId} hidden={!open}>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}

/** Toggle inline kecil — pengganti <details> untuk menu aksi per baris tabel. */
export function InlineToggle({
  label = "Aksi",
  children,
  className = "",
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelId = `${id}-panel`;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="btn-link inline-flex cursor-pointer items-center gap-1"
      >
        {open ? "Tutup" : label}
      </button>
      <div id={panelId} hidden={!open} className="mt-2">
        {children}
      </div>
    </div>
  );
}

/** Tombol yang membuka form dalam satu panel — dipakai untuk aksi utama. */
export function ActionPanel({
  label,
  children,
  defaultOpen = false,
  tone = "pink",
}: {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "pink" | "zinc" | "green";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;
  const headerClass =
    tone === "green" ? "card-header-green" : tone === "zinc" ? "card-header-zinc" : "card-header";
  const iconClass = tone === "green" ? "text-white" : tone === "zinc" ? "text-zinc-600" : "text-pink-600";

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${headerClass} flex w-full cursor-pointer items-center justify-between gap-3 text-left transition hover:brightness-[0.98]`}
      >
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={`${iconClass} shrink-0 text-lg leading-none font-bold transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div id={panelId} hidden={!open}>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}

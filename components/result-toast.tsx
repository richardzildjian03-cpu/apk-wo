"use client";

export type ToastTone = "success" | "warning" | "error";

const TONE = {
  success: {
    box: "border-emerald-500 bg-emerald-50 text-emerald-900",
    icon: "bg-emerald-600",
    mark: "✓",
  },
  warning: {
    box: "border-amber-400 bg-amber-50 text-amber-900",
    icon: "bg-amber-500",
    mark: "!",
  },
  error: {
    box: "border-red-400 bg-red-50 text-red-900",
    icon: "bg-red-600",
    mark: "✕",
  },
} as const;

/** Notifikasi melayang di bagian atas layar. */
/** Dipakai setelah scan / konfirmasi check-in agar hasilnya langsung terlihat tanpa scroll. */

export function ResultToast({
  open,
  tone,
  title,
  message,
  onClose,
}: {
  open: boolean;
  tone: ToastTone;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const t = TONE[tone];

  return (
    <div
      role="status"
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div
        className={`toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border-2 px-4 py-3 shadow-2xl ${t.box}`}
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-bold text-white ${t.icon}`}
          aria-hidden="true"
        >
          {t.mark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs leading-snug">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="shrink-0 cursor-pointer rounded-md p-1 text-lg leading-none opacity-60 transition hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
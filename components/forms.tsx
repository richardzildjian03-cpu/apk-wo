"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";

export function ActionForm({
  action,
  children,
  className,
  multipart = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  multipart?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      encType={multipart ? "multipart/form-data" : undefined}
    >
      {children}
      {state ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.ok
              ? "border border-emerald-300 bg-emerald-100 font-medium text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const base =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
        ? "btn-secondary"
        : "btn-danger";
  return (
    <button type="submit" disabled={pending} className={`${base} ${className ?? ""}`}>
      {pending ? "Menyimpan..." : children}
    </button>
  );
}

export function ConfirmSubmit({
  children,
  message = "Yakin ingin menghapus data ini?",
}: {
  children: React.ReactNode;
  message?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-danger"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Menghapus..." : children}
    </button>
  );
}

export function CopyButton({ text, label = "Salin Tautan" }: { text: string; label?: string }) {
  const [tersalin, setTersalin] = useState(false);

  return (
    <button
      type="button"
      className="btn-secondary !px-3 !py-1.5 text-xs"
      onClick={async () => {
        let sukses = false;
        try {
          await navigator.clipboard.writeText(text);
          sukses = true;
        } catch {
          // Fallback untuk browser/konteks tanpa clipboard API (mis. HTTP non-localhost)
          try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            sukses = document.execCommand("copy");
            document.body.removeChild(ta);
          } catch {
            sukses = false;
          }
        }

        if (sukses) {
          setTersalin(true);
          setTimeout(() => setTersalin(false), 1800);
        } else {
          window.prompt("Salin tautan berikut secara manual:", text);
        }
      }}
    >
      {tersalin ? "Tersalin!" : label}
    </button>
  );
}

export function PrintButton({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn-secondary" onClick={() => window.print()}>
      {label}
    </button>
  );
}

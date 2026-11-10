"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResultToast, type ToastTone } from "@/components/result-toast";

type Hasil = {
  ok: boolean;
  duplicate?: boolean;
  nama?: string;
  status?: string;
  jumlahKursi?: number;
  rsvpLabel?: string;
  waktu?: string;
  message: string;
};

function formatWaktu(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d)} • ${new Intl.DateTimeFormat(
    "id-ID",
    { timeStyle: "short" },
  ).format(d)}`;
}

/**
 * Check-in mandiri dari halaman undangan digital.
 *
 * Tamu yang sudah terdaftar (punya undangan) dikenali lewat qrToken — tidak
 * perlu menulis nama manual. Setelah konfirmasi, notifikasi melayang muncul di
 * bagian atas layar sehingga langsung terlihat tanpa perlu menggulir.
 */
export function UndanganCheckin({
  eventToken,
  qrToken,
  namaTamu,
  maxKursi,
}: {
  eventToken: string;
  qrToken: string;
  namaTamu: string;
  maxKursi: number;
}) {
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Notifikasi harus langsung terlihat begitu muncul.
  useEffect(() => {
    if (!hasil) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hasil]);

  const kirim = useCallback(async () => {
    if (mengirim) return;
    setMengirim(true);
    setHasil(null);
    try {
      const res = await fetch("/api/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventToken, qrToken, nama: namaTamu }),
      });
      const data = (await res.json()) as Hasil;
      if (!mountedRef.current) return;
      setHasil(data);

      if (data.ok && !data.duplicate) {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(180);
        try {
          const win = window as unknown as {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          };
          const Ctx = win.AudioContext ?? win.webkitAudioContext;
          if (Ctx) {
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.12;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
            setTimeout(() => void ctx.close(), 500);
          }
        } catch {
          /* audio tidak wajib */
        }
      }
    } catch {
      if (mountedRef.current) {
        setHasil({ ok: false, message: "Koneksi gagal. Periksa internet lalu coba lagi." });
      }
    } finally {
      if (mountedRef.current) setMengirim(false);
    }
  }, [eventToken, qrToken, namaTamu, mengirim]);

  const tone: ToastTone = hasil?.ok ? (hasil.duplicate ? "warning" : "success") : "error";
  const judul = hasil?.ok
    ? hasil.duplicate
      ? "Sudah tercatat sebelumnya"
      : "Check-in berhasil"
    : "Check-in gagal";

  return (
    <section className="mt-8 rounded-2xl border border-pink-100 bg-white/80 p-6 shadow-sm">
      <ResultToast
        open={hasil !== null}
        tone={tone}
        title={judul}
        message={hasil?.message ?? ""}
        onClose={() => setHasil(null)}
      />

      <p className="text-xs tracking-[0.3em] text-pink-400 uppercase">Check-in Sekarang</p>

      {hasil ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl border p-4 text-center ${
            hasil.ok
              ? "border-emerald-400 bg-emerald-50"
              : hasil.duplicate
                ? "border-amber-300 bg-amber-50"
                : "border-red-300 bg-red-50"
          }`}
        >
          <p
            className={`text-xs font-semibold tracking-wide uppercase ${
              hasil.ok ? "text-emerald-700" : hasil.duplicate ? "text-amber-600" : "text-red-600"
            }`}
          >
            {hasil.ok ? "Kehadiran Tercatat" : hasil.duplicate ? "Sudah Tercatat" : "Gagal"}
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{hasil.nama ?? namaTamu}</p>
          {hasil.waktu ? (
            <p className="mt-1 text-xs text-zinc-500">Waktu: {formatWaktu(hasil.waktu)}</p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-600">{hasil.message}</p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => setHasil(null)}
          >
            {hasil.ok ? "Tutup" : "Coba Lagi"}
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-600">
            Konfirmasi kehadiran Anda langsung dari halaman undangan — cukup satu tombol.
          </p>
          <p className="mt-3 rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-700">
            Check-in atas nama <strong>{namaTamu}</strong>
            {maxKursi > 1 ? ` (${maxKursi} kursi)` : ""}.
          </p>
          <button
            type="button"
            disabled={mengirim}
            onClick={() => void kirim()}
            className="btn-primary mt-4 w-full"
          >
            {mengirim ? "Menyimpan..." : "Konfirmasi Kehadiran"}
          </button>
        </>
      )}
    </section>
  );
}
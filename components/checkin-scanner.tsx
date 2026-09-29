"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScanResult = {
  ok: boolean;
  duplicate: boolean;
  nama?: string;
  status?: string;
  jumlahKursi?: number;
  rsvpLabel?: string;
  waktu?: string;
  autoRsvp?: boolean;
  message: string;
};

type ScannerInstance = {
  stop: () => Promise<void>;
  clear: () => void;
};

function formatWaktu(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${new Intl.DateTimeFormat("id-ID", { dateStyle: "short" }).format(d)} ${new Intl.DateTimeFormat(
    "id-ID",
    { timeStyle: "short" },
  ).format(d)}`;
}

export function CheckinScanner({
  eventId,
  totalTamu,
  initialCheckedIn,
}: {
  eventId: number;
  totalTamu: number;
  initialCheckedIn: number;
}) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef<ScannerInstance | null>(null);
  const lastScanRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const mountedRef = useRef(true);

  const beep = useCallback((ok: boolean, duplicate: boolean) => {
    try {
      const win = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = win.AudioContext ?? win.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = ok ? 900 : duplicate ? 500 : 200;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.15 : 0.4));
      setTimeout(() => void ctx.close(), 600);
    } catch {
      /* abaikan */
    }
    if (ok && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(150);
    }
  }, []);

  const submitToken = useCallback(
    async (tokenRaw: string) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenRaw, eventId }),
        });
        const data = (await res.json()) as ScanResult;
        setResult(data);
        beep(data.ok, data.duplicate);
        if (data.ok) {
          setCheckedIn((c) => c + 1);
          router.refresh();
        }
      } catch {
        setResult({ ok: false, duplicate: false, message: "Gagal terhubung ke server." });
        beep(false, false);
      } finally {
        setSubmitting(false);
      }
    },
    [eventId, beep, router],
  );

  const onDecoded = useCallback(
    (text: string) => {
      const now = Date.now();
      if (text === lastScanRef.current.text && now - lastScanRef.current.at < 4000) return;
      lastScanRef.current = { text, at: now };
      void submitToken(text);
    },
    [submitToken],
  );

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* abaikan */
      }
    }
    if (mountedRef.current) setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setResult(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode("checkin-reader");
      scannerRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => onDecoded(decodedText),
        () => {
          /* frame tanpa QR — abaikan */
        },
      );
      setScanning(true);
    } catch {
      scannerRef.current = null;
      setScanning(false);
      setCameraError(
        "Kamera tidak dapat diakses. Penyebab umum: (1) izin kamera ditolak — izinkan ulang dari ikon kunci di address bar; (2) halaman dibuka BUKAN via localhost/HTTPS — browser memblokir kamera pada HTTP biasa, mis. saat membuka dari HP dengan alamat IP seperti http://192.168.x.x:3000. Solusi: buka dari perangkat yang sama dengan server (localhost), atau gunakan HTTPS via tunnel (cth. npx localtunnel --port 3000), atau deploy dengan HTTPS. Sementara itu, gunakan input manual di bawah.",
      );
    }
  }, [onDecoded]);

  useEffect(() => {
    mountedRef.current = true;
    const onUnhandled = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { name?: string; message?: string } | undefined;
      if (
        reason?.name === "AbortError" &&
        typeof reason.message === "string" &&
        /play\(\)|new load request/.test(reason.message)
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("unhandledrejection", onUnhandled);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {
            /* abaikan */
          });
      }
    };
  }, []);

  return (
    <div className="card">
      <div className="card-header-green flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title-white">Scan QR Tamu</h2>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
          {checkedIn}/{totalTamu} tamu sudah check-in
        </span>
      </div>
      <div className="card-body space-y-4">
        {/* Counter */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-3">
            <p className="text-xs text-zinc-500">Total Tamu</p>
            <p className="text-xl font-semibold text-zinc-900">{totalTamu}</p>
          </div>
          <div className="rounded-lg border border-emerald-700 bg-emerald-600 px-2 py-3 shadow-md shadow-emerald-600/30">
            <p className="text-xs font-medium text-emerald-100">Sudah Check-in</p>
            <p className="text-xl font-bold text-white">{checkedIn}</p>
          </div>
          <div className="rounded-lg border border-pink-300 bg-pink-100 px-2 py-3">
            <p className="text-xs font-medium text-pink-700">Belum Check-in</p>
            <p className="text-xl font-semibold text-pink-800">{totalTamu - checkedIn}</p>
          </div>
        </div>

        {/* Kamera — div ini TIDAK boleh punya children dari React;
            html5-qrcode menyuntikkan elemen video/canvas-nya sendiri di sini */}
        <div className="relative mx-auto w-full max-w-xs">
          <div
            id="checkin-reader"
            className={`w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 ${
              scanning ? "min-h-64" : "min-h-16"
            }`}
          />
          {!scanning ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-zinc-400">
              Kamera belum aktif — tekan tombol &quot;Mulai Scan&quot;
            </p>
          ) : null}
        </div>

        <div className="flex justify-center gap-2">
          {scanning ? (
            <button type="button" className="btn-secondary" onClick={() => void stopScanner()}>
              Hentikan Kamera
            </button>
          ) : (
            <button type="button" className="btn-success" onClick={() => void startScanner()}>
              Mulai Scan
            </button>
          )}
        </div>

        {cameraError ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{cameraError}</p>
        ) : null}

        {/* Hasil scan */}
        {result ? (
          <div
            className={`rounded-xl border p-4 text-center ${
              result.ok
                ? "border-emerald-400 bg-emerald-100"
                : result.duplicate
                  ? "border-amber-300 bg-amber-50"
                  : "border-red-300 bg-red-50"
            }`}
          >
            <p
              className={`text-xs font-semibold tracking-wide uppercase ${
                result.ok
                  ? "text-emerald-700"
                  : result.duplicate
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
            >
              {result.ok
                ? "Check-in Berhasil"
                : result.duplicate
                  ? "Sudah Check-in Sebelumnya"
                  : "Gagal"}
            </p>
            {result.nama ? (
              <p className="mt-1 text-2xl font-bold text-zinc-900">{result.nama}</p>
            ) : null}
            {result.nama ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
                {result.status === "VIP" ? (
                  <span className="badge badge-violet">VIP</span>
                ) : (
                  <span className="badge badge-zinc">Regular</span>
                )}
                <span className="badge badge-pink">{result.jumlahKursi} kursi</span>
                <span className="badge badge-green">RSVP: {result.rsvpLabel}</span>
                {result.ok && result.autoRsvp ? (
                  <span className="badge badge-green">RSVP otomatis: Hadir</span>
                ) : null}
              </div>
            ) : null}
            {result.waktu ? (
              <p className="mt-2 text-xs text-zinc-500">Waktu: {formatWaktu(result.waktu)}</p>
            ) : null}
            <p
              className={`mt-2 text-sm ${
                result.ok
                  ? "text-emerald-700"
                  : result.duplicate
                    ? "text-amber-700"
                    : "text-red-700"
              }`}
            >
              {result.message}
            </p>
          </div>
        ) : null}

        {/* Input manual */}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const val = manualToken.trim();
            if (!val || submitting) return;
            setManualToken("");
            void submitToken(val);
          }}
        >
          <label htmlFor="manualToken" className="label">
            Input Manual (token atau tautan undangan)
          </label>
          <div className="flex gap-2">
            <input
              id="manualToken"
              className="input"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Tempel tautan /undangan/... atau token QR"
            />
            <button type="submit" disabled={submitting} className="btn-primary shrink-0">
              {submitting ? "Memproses..." : "Check-in"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Digunakan bila QR rusak / tamu lupa membawa QR — cari nama tamu di daftar lalu minta
            tautannya, atau scan QR cadangan.
          </p>
        </form>
      </div>
    </div>
  );
}

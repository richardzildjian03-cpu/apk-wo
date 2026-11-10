"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResultToast } from "@/components/result-toast";

type TamuOption = {
  nama: string;
  status: string;
  jumlahKursi: number;
  sudahHadir: boolean;
};

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

export function SelfCheckinForm({
  eventToken,
  namaAcara,
}: {
  eventToken: string;
  namaAcara: string;
}) {
  const [nama, setNama] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [keterangan, setKeterangan] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [tamuList, setTamuList] = useState<TamuOption[]>([]);
  const [showSaran, setShowSaran] = useState(false);

  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil daftar tamu untuk autocomplete — sekali saja.
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/self-checkin?event=${encodeURIComponent(eventToken)}`);
        const data = (await res.json()) as { ok: boolean; tamu?: TamuOption[] };
        if (!cancelled && data.ok && data.tamu) setTamuList(data.tamu);
      } catch {
        /* offline — autocomplete dilewati, nama tetap bisa diketik manual */
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [eventToken]);

  const saran = useMemo(() => {
    const q = nama.toLowerCase().trim();
    if (q.length < 1) return [];
    return tamuList
      .filter((t) => t.nama.toLowerCase().includes(q))
      .slice(0, 6);
  }, [nama, tamuList]);

  const cocokPersis = useMemo(
    () => tamuList.find((t) => t.nama.toLowerCase() === nama.toLowerCase().trim()) ?? null,
    [nama, tamuList],
  );

  const kirim = useCallback(
    async (namaKirim: string, jumlahKirim: number) => {
      if (!namaKirim.trim()) return;
      setMengirim(true);
      setHasil(null);
      try {
        const res = await fetch("/api/self-checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventToken,
            nama: namaKirim.trim(),
            jumlah: jumlahKirim,
            keterangan: keterangan.trim() || undefined,
          }),
        });
        const data = (await res.json()) as Hasil;
        if (!mountedRef.current) return;
        setHasil(data);
        if (data.ok) {
          // Getar + suara singkat sebagai konfirmasi (didukung mayoritas HP).
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
    },
    [eventToken, keterangan],
  );

  const kirimLagi = useCallback(() => {
    setHasil(null);
    setNama("");
    setJumlah(1);
    setKeterangan("");
    inputRef.current?.focus();
  }, []);

  // Begitu hasil masuk, pastikan notifikasi di atas layar langsung terlihat.
  useEffect(() => {
    if (!hasil) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hasil]);

  const tone = hasil?.ok ? (hasil.duplicate ? "warning" : "success") : "error";
  const judulToast = hasil?.ok
    ? hasil.duplicate
      ? "Sudah tercatat sebelumnya"
      : "Check-in berhasil"
    : "Check-in gagal";

  return (
    <div className="space-y-5">
      <ResultToast
        open={hasil !== null}
        tone={tone}
        title={judulToast}
        message={hasil?.message ?? ""}
        onClose={() => setHasil(null)}
      />

      {/* Hasil — diletakkan di atas form agar langsung terlihat setelah konfirmasi */}
      {hasil ? (
        <div
          className={`rounded-2xl border p-5 text-center shadow-sm ${
            hasil.ok
              ? "border-emerald-400 bg-emerald-50"
              : hasil.duplicate
                ? "border-amber-300 bg-amber-50"
                : "border-red-300 bg-red-50"
          }`}
          role="status"
          aria-live="polite"
        >
          <p
            className={`text-xs font-semibold tracking-wide uppercase ${
              hasil.ok ? "text-emerald-700" : hasil.duplicate ? "text-amber-600" : "text-red-600"
            }`}
          >
            {hasil.ok ? "Kehadiran Tercatat" : hasil.duplicate ? "Sudah Tercatat" : "Gagal"}
          </p>
          {hasil.nama ? (
            <p className="inv-serif mt-2 text-2xl font-bold text-zinc-900">{hasil.nama}</p>
          ) : null}
          {hasil.nama ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              {hasil.status === "VIP" ? (
                <span className="badge badge-violet">VIP</span>
              ) : (
                <span className="badge badge-zinc">{hasil.status}</span>
              )}
              {hasil.jumlahKursi ? (
                <span className="badge badge-pink">{hasil.jumlahKursi} kursi</span>
              ) : null}
              {hasil.rsvpLabel ? <span className="badge badge-green">{hasil.rsvpLabel}</span> : null}
            </div>
          ) : null}
          {hasil.waktu ? (
            <p className="mt-2 text-xs text-zinc-500">Waktu: {formatWaktu(hasil.waktu)}</p>
          ) : null}
          <p
            className={`mt-3 text-sm ${
              hasil.ok ? "text-emerald-700" : hasil.duplicate ? "text-amber-700" : "text-red-700"
            }`}
          >
            {hasil.message}
          </p>
          <p className="mt-4 text-xs text-zinc-400">
            {namaAcara} — silakan tunjukkan layar ini kepada petugas bila diminta.
          </p>

          {hasil.ok ? (
            <button type="button" className="btn-secondary mt-4" onClick={kirimLagi}>
              Isi Kehadiran Lain
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => setHasil(null)}
            >
              Coba Lagi
            </button>
          )}
        </div>
      ) : null}

      {/* Form konfirmasi kehadiran — disembunyikan setelah sukses agar layar bersih */}
      {hasil?.ok ? null : (
        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs tracking-[0.25em] text-pink-400 uppercase">Konfirmasi Kehadiran</p>
          <h2 className="inv-serif mt-1 text-lg font-semibold text-zinc-900">
            Tulis Nama Anda
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Nama sesuai undangan agar kehadiran Anda langsung tercatat.
          </p>

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (mengirim) return;
              void kirim(nama, jumlah);
            }}
          >
            <div className="relative">
              <label htmlFor="nama" className="label">
                Nama Anda
              </label>
              <input
                id="nama"
                ref={inputRef}
                className="input"
                value={nama}
                autoComplete="off"
                enterKeyHint="search"
                placeholder="cth: Budi Santoso"
                onChange={(e) => {
                  setNama(e.target.value);
                  setShowSaran(true);
                }}
                onFocus={() => setShowSaran(true)}
                onBlur={() => {
                  // Tunda agar klik pada saran tetap terdaftar.
                  setTimeout(() => setShowSaran(false), 150);
                }}
                required
              />

              {showSaran && saran.length > 0 && !cocokPersis ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-pink-200 bg-white shadow-lg">
                  {saran.map((t) => (
                    <li key={t.nama}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-pink-50"
                        onClick={() => {
                          setNama(t.nama);
                          setJumlah(t.jumlahKursi);
                          setShowSaran(false);
                        }}
                      >
                        <span className="font-medium text-zinc-800">
                          {t.nama}
                          {t.status === "VIP" ? (
                            <span className="ml-2 badge badge-violet">VIP</span>
                          ) : null}
                        </span>
                        <span className="text-xs text-zinc-400">{t.jumlahKursi} kursi</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {cocokPersis ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  cocokPersis.sudahHadir
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {cocokPersis.sudahHadir ? (
                  <>Nama ini sudah tercatat hadir sebelumnya.</>
                ) : (
                  <>
                    Ditemukan: <strong>{cocokPersis.nama}</strong>
                    {cocokPersis.status === "VIP" ? " (Tamu VIP)" : ""} — {cocokPersis.jumlahKursi} kursi
                  </>
                )}
              </div>
            ) : nama.trim().length > 2 ? (
              <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                Nama tidak ada di daftar undangan. Anda tetap bisa konfirmasi — kehadiran akan dicatat
                sebagai tamu tambahan.
              </p>
            ) : null}

            <div>
              <label htmlFor="jumlah" className="label">
                Jumlah orang yang hadir {cocokPersis ? `(maks. ${cocokPersis.jumlahKursi} kursi)` : ""}
              </label>
              <input
                id="jumlah"
                type="number"
                min={1}
                max={cocokPersis?.jumlahKursi ?? 20}
                className="input"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value) || 1)}
              />
            </div>

            {!cocokPersis && nama.trim().length > 2 ? (
              <div>
                <label htmlFor="keterangan" className="label">
                  Keterangan tambahan (opsional)
                </label>
                <input
                  id="keterangan"
                  className="input"
                  value={keterangan}
                  placeholder="cth: Tamu pendamping Bu Rina"
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              </div>
            ) : null}

            <button type="submit" disabled={mengirim || !nama.trim()} className="btn-primary w-full">
              {mengirim ? "Menyimpan..." : "Konfirmasi Kehadiran"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

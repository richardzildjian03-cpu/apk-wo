"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { InlineToggle } from "@/components/disclosure";
import type { ActionState } from "@/lib/types";

export type ModeQrPanelProps = {
  eventId: number;
  modeAktif: string;
  eventToken: string;
  origin: string;
  setModeAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  regenerateAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

const MODES = [
  {
    value: "PER_TAMU",
    label: "1 Tamu 1 QR",
    ringkas: "QR pribadi per tamu",
    detail:
      "Setiap tamu menerima QR sendiri di undangan digitalnya. Petugas scan di pintu masuk — nama, status VIP, dan jumlah kursi langsung tampil. Anti check-in ganda.",
    cocok: "Ada petugas di pintu masuk",
  },
  {
    value: "SATU_QR",
    label: "1 QR untuk Semua Tamu",
    ringkas: "Satu QR master acara",
    detail:
      "Satu QR untuk seluruh acara. Tamu scan sendiri, lalu menulis nama mereka di halaman check-in. Jalan di iPhone (Safari) dan Android (Chrome).",
    cocok: "Tanpa petugas / tamu mandiri",
  },
] as const;

export function ModeQrPanel({
  eventId,
  modeAktif,
  eventToken,
  origin,
  setModeAction,
  regenerateAction,
}: ModeQrPanelProps) {
  const [pilih, setPilih] = useState(modeAktif);
  const [salinTeks, setSalinTeks] = useState<string | null>(null);

  const urlCheckin = `${origin}/checkin/${eventToken}`;
  const urlQr = `${origin}/api/qr-acara/${eventToken}?ukuran=1024`;
  const berubah = pilih !== modeAktif;

  async function salin(teks: string, label: string) {
    try {
      await navigator.clipboard.writeText(teks);
      setSalinTeks(label);
      setTimeout(() => setSalinTeks(null), 2200);
    } catch {
      window.prompt("Salin manual:", teks);
    }
  }

  return (
    <div className="card">
      <div className="card-header flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="card-title">Mode QR Check-in</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pilih cara tamu Anda check-in di hari acara.
          </p>
        </div>
        <span className="badge badge-pink">
          Aktif: {MODES.find((m) => m.value === modeAktif)?.label ?? modeAktif}
        </span>
      </div>

      <div className="card-body space-y-5">
        {/* Pilihan mode */}
        <ActionForm action={setModeAction} className="space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="modeQr" value={pilih} />

          <div className="grid gap-3 md:grid-cols-2">
            {MODES.map((m) => {
              const aktif = pilih === m.value;
              const terpasang = modeAktif === m.value;
              return (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setPilih(m.value)}
                  aria-pressed={aktif}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-left transition ${
                    aktif
                      ? "border-pink-500 bg-pink-50 shadow-md shadow-pink-200/50"
                      : "border-zinc-200 bg-white hover:border-pink-300 hover:bg-pink-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900">{m.label}</p>
                    {terpasang ? <span className="badge badge-green">Terpasang</span> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-pink-600">{m.ringkas}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">{m.detail}</p>
                  <p className="mt-2 text-[11px] text-zinc-400">Cocok untuk: {m.cocok}</p>
                </button>
              );
            })}
          </div>

          <SubmitButton className="w-full md:w-auto">
            {berubah ? "Simpan Mode QR" : "Mode Sudah Terpasang"}
          </SubmitButton>
        </ActionForm>

        {/* Panel QR master — hanya tampil jika mode SATU_QR aktif */}
        {modeAktif === "SATU_QR" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-emerald-800">QR Master Acara</p>
            <p className="mt-1 text-xs text-emerald-700">
              Cetak atau tampilkan QR ini di meja penerimaan. Siapa pun yang scan akan dibawa ke
              halaman check-in dan mengisi namanya sendiri.
            </p>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr-acara/${eventToken}?ukuran=480`}
                  alt="QR master check-in acara"
                  width={200}
                  height={200}
                  className="h-48 w-48 object-contain"
                />
              </div>

              <div className="w-full space-y-3">
                <div>
                  <p className="label">Tautan check-in untuk tamu</p>
                  <div className="flex gap-2">
                    <input readOnly value={urlCheckin} className="input !text-xs" />
                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() => void salin(urlCheckin, "tautan")}
                    >
                      {salinTeks === "tautan" ? "Tersalin!" : "Salin"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/qr-acara/${eventToken}?ukuran=1024&unduh=1`}
                    className="btn-secondary"
                  >
                    Unduh QR (PNG)
                  </a>
                  <a
                    href={`/api/qr-acara/${eventToken}?ukuran=1024`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Buka QR Ukuran Besar
                  </a>
                  <a
                    href={urlCheckin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Pratinjau Halaman Tamu
                  </a>
                </div>

                <p className="text-[11px] text-emerald-700">
                  Tips cetak: gunakan QR ukuran besar (min. 5×5 cm) agar mudah discan kamera HP.
                </p>
              </div>
            </div>

            <InlineToggle label="QR tidak berfungsi atau bocor ke pihak lain? Perbarui QR" className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3">
              <div className="space-y-2">
                <p className="text-xs text-emerald-700">
                  Membuat QR baru akan membuat QR lama <strong>tidak berlaku lagi</strong>. QR yang
                  sudah dicetak dan dibagikan harus diganti.
                </p>
                <ActionForm action={regenerateAction}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <SubmitButton variant="danger">Perbarui QR Master</SubmitButton>
                </ActionForm>
              </div>
            </InlineToggle>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-700">Mode 1 Tamu 1 QR aktif</p>
            <p className="mt-1 text-xs text-zinc-500">
              QR pribadi setiap tamu tersedia di daftar tamu di bawah — lengkap dengan tombol kirim
              WhatsApp dan unduh QR. Petugas scan QR tamu lewat halaman Check-in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

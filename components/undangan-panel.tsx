"use client";

import { useState } from "react";
import { Disclosure } from "@/components/disclosure";
import { ActionForm, SubmitButton, CopyButton } from "@/components/forms";
import { saveUndanganAction } from "@/lib/actions/undangan";

type Props = {
  eventId: number;
  tipe: string | null;
  url: string | null;
  file: string | null;
  namaFile: string | null;
  defaultOpen?: boolean;
};

/**
 * Panel untuk mengatur undangan digital eksternal.
 * Dipakai admin (halaman event) dan klien (halaman klien).
 * Client bisa menempel link atau mengunggah file undangannya sendiri.
 */
export function UndanganPanel({ eventId, tipe, url, file, namaFile, defaultOpen = false }: Props) {
  const [mode, setMode] = useState(tipe === "LINK" || tipe === "FILE" ? tipe : "BAWAAN");

  const statusLabel =
    tipe === "LINK" ? "Link eksternal" : tipe === "FILE" ? "File eksternal" : "Bawaan aplikasi";

  return (
    <Disclosure
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="card-title">Undangan Digital</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              tipe === "LINK" || tipe === "FILE"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {statusLabel}
          </span>
        </span>
      }
      defaultOpen={defaultOpen}
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-zinc-500">
          Kalau client sudah punya undangan digital sendiri (dari vendor lain), tempel{" "}
          <strong>link</strong> atau unggah <strong>file</strong>-nya di sini. Tamu tetap memakai
          halaman undangan ini untuk konfirmasi kehadiran &amp; check-in, jadi QR tetap berfungsi.
        </p>

        {tipe === "LINK" && url ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <p className="font-semibold">Link undangan aktif:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all underline"
            >
              {url}
            </a>
            <div className="mt-2">
              <CopyButton text={url} label="Salin Link" />
            </div>
          </div>
        ) : null}

        {tipe === "FILE" && file ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <p className="font-semibold">File undangan aktif:</p>
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all underline"
            >
              {namaFile ?? file}
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                Buka File
              </a>
              <CopyButton text={file} label="Salin Path" />
            </div>
          </div>
        ) : null}

        <ActionForm action={saveUndanganAction} multipart className="space-y-3">
          <input type="hidden" name="eventId" value={eventId} />

          <div>
            <label htmlFor={`mode-undangan-${eventId}`} className="label">
              Sumber Undangan
            </label>
            <select
              id={`mode-undangan-${eventId}`}
              name="mode"
              className="input"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="BAWAAN">Undangan bawaan aplikasi</option>
              <option value="LINK">Link undangan (dari client/vendor)</option>
              <option value="FILE">Upload file undangan (PDF/gambar)</option>
            </select>
          </div>

          {mode === "LINK" ? (
            <div>
              <label htmlFor={`url-undangan-${eventId}`} className="label">
                Link Undangan
              </label>
              <input
                id={`url-undangan-${eventId}`}
                name="url"
                type="url"
                inputMode="url"
                className="input"
                placeholder="https://undangan.example.com/bagas-dewi"
                defaultValue={url ?? ""}
              />
              <p className="mt-1 text-xs text-zinc-400">
                Harus diawali http:// atau https://
              </p>
            </div>
          ) : null}

          {mode === "FILE" ? (
            <div>
              <label htmlFor={`file-undangan-${eventId}`} className="label">
                File Undangan
              </label>
              <input
                id={`file-undangan-${eventId}`}
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                className="input file:mr-3 file:rounded-md file:border-0 file:bg-pink-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-pink-700"
              />
              <p className="mt-1 text-xs text-zinc-400">
                PDF, JPG, PNG, atau WebP — maksimal 10MB.
                {tipe === "FILE" && file ? " Biarkan kosong jika tidak ingin mengganti file." : ""}
              </p>
            </div>
          ) : null}

          <SubmitButton className="w-full">
            {mode === "BAWAAN" ? "Pakai Undangan Bawaan" : "Simpan Undangan"}
          </SubmitButton>

          {mode === "BAWAAN" && (tipe === "LINK" || tipe === "FILE") ? (
            <p className="text-xs text-amber-700">
              Menyimpan pilihan ini akan menghapus undangan eksternal yang sedang aktif.
            </p>
          ) : null}
        </ActionForm>
      </div>
    </Disclosure>
  );
}

// Konstanta mode QR — dipisah dari lib/actions/qrmode.ts karena file
// ber-"use server" hanya boleh mengekspor fungsi async.

export const MODE_QR = {
  PER_TAMU: "PER_TAMU",
  SATU_QR: "SATU_QR",
} as const;

export type ModeQr = (typeof MODE_QR)[keyof typeof MODE_QR];

export const MODE_QR_LABELS: Record<string, string> = {
  PER_TAMU: "1 Tamu 1 QR",
  SATU_QR: "1 QR untuk Semua Tamu",
};

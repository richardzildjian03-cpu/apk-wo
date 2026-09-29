export const ROLES = {
  BOS: "BOS",
  LEADER: "LEADER",
  STAFF: "STAFF",
  KLIEN: "KLIEN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  BOS: "Bos (Owner)",
  LEADER: "Leader WO",
  STAFF: "Staff Admin",
  KLIEN: "Klien (Pengantin)",
};

export const INTERNAL_ROLES: Role[] = [ROLES.BOS, ROLES.LEADER, ROLES.STAFF];

export const EVENT_STATUSES = ["DRAFT", "AKTIF", "SELESAI", "DIBATALKAN"] as const;
export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const KATEGORI_TAMU = [
  { value: "KELUARGA_PRIA", label: "Keluarga Pengantin Pria" },
  { value: "KELUARGA_WANITA", label: "Keluarga Pengantin Wanita" },
  { value: "TEMAN", label: "Teman" },
  { value: "KOLEGA", label: "Kolega" },
] as const;

export const KATEGORI_LABELS: Record<string, string> = Object.fromEntries(
  KATEGORI_TAMU.map((k) => [k.value, k.label]),
);

export const TAMU_STATUS = ["VIP", "REGULAR"] as const;

export const RSVP_STATUSES = [
  { value: "HADIR", label: "Hadir" },
  { value: "TIDAK", label: "Tidak Hadir" },
] as const;

export const RSVP_LABELS: Record<string, string> = {
  HADIR: "Hadir",
  TIDAK: "Tidak Hadir",
};

export const KONFIRMASI_VENDOR = ["MENUNGGU", "DIKONFIRMASI", "DITOLAK"] as const;
export const KONFIRMASI_LABELS: Record<string, string> = {
  MENUNGGU: "Menunggu",
  DIKONFIRMASI: "Dikonfirmasi",
  DITOLAK: "Ditolak",
};

export const PIHAK = [
  { value: "PRIA", label: "Pengantin Pria" },
  { value: "WANITA", label: "Pengantin Wanita" },
] as const;

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTanggal(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTanggalWaktu(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

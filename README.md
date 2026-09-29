# DekorLamaran

Aplikasi web manajemen Wedding Organizer — implementasi dari PRD `PRD-Wedding-Organizer.md`.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma + SQLite**.

## Fitur

### Internal WO (login: Bos / Leader WO / Staff Admin)
- **Dashboard** — ringkasan event aktif, tamu, dan konfirmasi hadir (leader hanya melihat event yang diampu)
- **Event** — dibuat manual oleh Staff Admin (termasuk pembuatan akun klien baru), assign Leader WO, deteksi double-booking leader
- **Detail Event (4 tab)** — Rundown acara, Penugasan Vendor (dengan status konfirmasi), Daftar Tamu (baca-saja), Rekap Kehadiran
- **Check-in Tamu (H-day)** — halaman `/events/[id]/checkin`: scan QR via kamera HP (html5-qrcode), input manual token/tautan, anti check-in ganda, log + pembatalan (revert), counter live
- **Vendor** — CRUD vendor + penugasan ke event
- **Paket** — CRUD paket pernikahan (referensi internal, bukan katalog publik) dengan upload banyak foto sekaligus (maks 8 foto per paket, JPG/PNG/WebP, maks 4MB per foto, tersimpan di `public/uploads/paket/`). Foto tampil sebagai carousel di kartu paket dengan navigasi panah, titik indikator, counter posisi, dan keyboard arrow. Di form edit, hapus foto satu per satu lewat checkbox.
- **Pengguna** — kelola akun bos/leader/staff/klien, reset password
- **Laporan** — rekap kehadiran tamu semua event + export Excel (CSV)

### Klien / Pengantin (login: Klien)
- **Ringkasan acara** + edit data pengantin kedua pihak (nama, panggilan, anak ke-, orang tua)
- **Keluarga** — data keluarga kedua pihak (tampil di undangan digital)
- **Tamu & QR** — tambah/edit/hapus tamu (VIP/Regular, kategori, jumlah kursi), import massal dari Excel/CSV, QR code otomatis per tamu, kirim undangan via WhatsApp, salin tautan, unduh gambar QR
- **Rekap Hadir** — rekap RSVP + unduh Excel (CSV) + cetak/PDF

### Tamu (tanpa login)
- **Undangan digital** via tautan unik `/undangan/[token]` — nama pengantin, data keluarga, detail acara, Google Maps, QR pribadi, badge VIP
- **RSVP** — konfirmasi hadir / tidak / belum pasti + jumlah orang, dapat diubah kapan saja

## Menjalankan Aplikasi

```bash
# 1. Install dependensi
npm install

# 2. Buat/sinkronkan database + data contoh
npm run db:push
npm run db:seed

# 3. Jalankan development server
npm run dev

# 4. Buka http://localhost:3000
```

Production build: `npm run build && npm start`

## Akun Demo (password: `password123`)

| Role | Email |
|---|---|
| Bos (Owner) | `bos@wo.id` |
| Leader WO | `leader@wo.id` |
| Staff Admin | `staff@wo.id` |
| Klien (Pengantin) | `klien@wo.id`, `klien2@wo.id` |

## Konfigurasi

File `.env`:
- `DATABASE_URL` — lokasi database SQLite
- `AUTH_SECRET` — kunci signing JWT session (wajib diganti di produksi)

## Struktur Utama

```
app/
  (internal)/          # Panel internal (dashboard, events, vendors, packages, users, reports)
  klien/[eventId]/     # Portal klien (ringkasan, keluarga, tamu, rekap)
  undangan/[token]/    # Undangan digital publik + RSVP
  api/qr/[token]/      # Endpoint gambar QR (PNG)
  api/export/[eventId]/# Endpoint export rekap CSV
lib/
  actions/             # Server actions (auth, users, packages, vendors, events, guests)
  auth.ts              # Session JWT (jose), bcrypt, RBAC helpers
proxy.ts               # Optimistic auth redirect (Next 16 proxy/middleware)
prisma/schema.prisma   # Skema database
```

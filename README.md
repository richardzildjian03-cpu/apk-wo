# DekorLamaran

Aplikasi web manajemen Wedding Organizer — implementasi dari PRD `PRD-Wedding-Organizer.md`.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma + SQLite**.

## Fitur

### Internal WO (login: Bos / Leader WO / Staff Admin)
- **Dashboard** — ringkasan event aktif, tamu, dan konfirmasi hadir (leader hanya melihat event yang diampu)
- **Event** — dibuat manual oleh Staff Admin (termasuk pembuatan akun klien baru), assign Leader WO, deteksi double-booking leader
- **Detail Event (4 tab)** — Rundown acara, Penugasan Vendor (dengan status konfirmasi), Daftar Tamu (baca-saja), Rekap Kehadiran
- **Pengaturan** — halaman admin untuk mengatur branding (logo upload + nama situs + tagline), teks footer undangan digital, kontak/sosial media, dan informasi bisnis — semua perubahan langsung ter-refleksi di sidebar, login, portal klien, dan undangan digital tamu
- **Check-in Tamu (H-day)** — halaman `/events/[id]/checkin`: scan QR via kamera HP (html5-qrcode), input manual token/tautan, anti check-in ganda, log + pembatalan (revert), counter live, daftar walk-in hasil check-in mandiri
- **Vendor** — CRUD vendor + penugasan ke event
- **Paket** — CRUD paket pernikahan (referensi internal, bukan katalog publik) dengan upload banyak foto sekaligus (maks 8 foto per paket, JPG/PNG/WebP, maks 4MB per foto, tersimpan di `public/uploads/paket/`). Foto tampil sebagai carousel di kartu paket dengan navigasi panah, titik indikator, counter posisi, dan keyboard arrow. Di form edit, hapus foto satu per satu lewat checkbox.
- **Pengguna** — kelola akun bos/leader/staff/klien, reset password
- **Laporan** — rekap kehadiran tamu semua event + export Excel (CSV)

### Klien / Pengantin (login: Klien)
- **Ringkasan acara** + edit data pengantin kedua pihak (nama, panggilan, anak ke-, orang tua)
- **Keluarga** — data keluarga kedua pihak (tampil di undangan digital)
- **Tamu & QR** — tambah/edit/hapus tamu (VIP/Regular, kategori, jumlah kursi), import massal dari Excel/CSV, QR code otomatis per tamu, kirim undangan via WhatsApp, salin tautan, unduh gambar QR
- **Mode QR Check-in** — pilih antara **1 Tamu 1 QR** (petugas scan QR tamu) atau **1 QR untuk Semua Tamu** (satu QR master, tamu check-in mandiri). QR master bisa diunduh sebagai PNG siap cetak, dan tokennya bisa diperbarui bila bocor.
- **Rekap Hadir** — rekap RSVP + status check-in + walk-in, unduh Excel (CSV), cetak/PDF

### Tamu (tanpa login)
- **Undangan digital** via tautan unik `/undangan/[token]` — nama pengantin, data keluarga, detail acara, Google Maps, QR pribadi, badge VIP
- **RSVP** — konfirmasi hadir / tidak + jumlah orang, dapat diubah kapan saja
- **Check-in mandiri** (mode 1 QR) via `/checkin/[eventToken]` — tamu scan QR master, tulis nama (autocomplete dari daftar tamu), kehadiran langsung tercatat. Nama di luar daftar dicatat sebagai walk-in. Jalan di Safari (iPhone) dan Chrome (Android).

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
  (internal)/          # Panel internal (dashboard, events, vendors, packages, users, reports, settings)
  klien/[eventId]/     # Portal klien (ringkasan, keluarga, tamu+QR, rekap)
  undangan/[token]/    # Undangan digital publik + RSVP
  checkin/[eventToken]/# Halaman check-in mandiri tamu (mode 1 QR)
  api/qr/[token]/      # Endpoint gambar QR pribadi tamu (PNG)
  api/qr-acara/[eventToken]/ # Endpoint gambar QR master acara (PNG)
  api/self-checkin/    # API check-in mandiri + daftar tamu (GET)
  api/checkin/         # API check-in oleh petugas (mode 1 tamu 1 QR)
  api/export/[eventId]/# Endpoint export rekap CSV
components/
  mode-qr-panel.tsx    # Panel pilih mode QR + QR master
  self-checkin-form.tsx# Form check-in mandiri tamu
lib/
  actions/             # Server actions (auth, users, packages, vendors, events, guests, qrmode)
  auth.ts              # Session JWT (jose), bcrypt, RBAC helpers
prisma/schema.prisma   # Skema database
```

## Mode QR Check-in

Ada dua mode, diatur per event:

| Mode | Cara kerja | Kapan dipakai |
|---|---|---|
| **1 Tamu 1 QR** (default) | Setiap tamu punya QR pribadi di undangan digitalnya. Petugas scan QR tamu → nama, status VIP, jumlah kursi muncul. Anti check-in ganda. | Ada petugas di pintu masuk |
| **1 QR untuk Semua Tamu** | Satu QR master per acara. Tamu scan sendiri → buka `/checkin/[token]` → tulis nama (autocomplete) → kehadiran tercatat. Nama di luar daftar jadi walk-in. | Tanpa petugas / tamu mandiri |

Diatur di **portal klien → Tamu & QR → Mode QR Check-in**, atau dari tab Tamu di detail event internal.

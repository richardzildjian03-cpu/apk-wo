# Catatan Proyek — DekorLamaran (apk-wo)

## Akun & Repo GitHub

| Item | Nilai |
| --- | --- |
| GitHub username | `richardzildjian03-cpu` |
| Email commit | `richardzildjian03-cpu@users.noreply.github.com` |
| Nama commit (`user.name`) | `richardzildjian03-cpu` |
| Repo | https://github.com/richardzildjian03-cpu/apk-wo |
| Remote git | `origin` → `https://github.com/richardzildjian03-cpu/apk-wo.git` |
| Branch utama | `main` |
| Credential helper | `manager` (Git Credential Manager, login via pop-up browser) |

Semua nilai di atas sudah tersimpan sebagai config lokal repo ini (`.git/config`), jadi `git push` berikutnya cukup:

```bash
git add -A
git commit -m "pesan"
git push
```

Jika nanti muncul error identitas, set dengan:

```bash
git config user.name "richardzildjian03-cpu"
git config user.email "richardzildjian03-cpu@users.noreply.github.com"
```

## Yang Tidak Boleh Ikut Commit

Sudah tercakup di `.gitignore`, jangan di-force add:

- `.env*` — berisi `DATABASE_URL` dan `AUTH_SECRET`
- `prisma/dev.db` / `*.db`
- `node_modules/`, `.next/`
- `*.tsbuildinfo`
- `public/uploads/paket/*` (kecuali `.gitkeep`)

`dev-server.log` belum ada di `.gitignore`. Tambahkan kalau tidak mau ikut commit.

## Menjalankan Proyek

Lokasi: `D:\kuliahunpam\KP\wo-app`

```bash
npm.cmd install      # pakai npm.cmd, bukan npm — PowerShell Execution Policy memblokir npm.ps1
npm.cmd run dev      # http://localhost:3000
```

Catatan lingkungan Windows:

- `npm` (ps1) tidak bisa dipanggil langsung → gunakan `npm.cmd`
- Jalankan dev server dengan `Start-Process` agar tidak memblokir shell
- Database SQLite lokal, seed ada di `prisma/seed.mjs` (perintah: `npm.cmd run db:seed`)

## Riwayat Commit Penting

- `776f410` first commit — push awal seluruh kode ke `main` (60 file, dipush 29 Sep 2026)
- Commit selanjutnya: rebrand ke DekorLamaran, halaman Pengaturan, upload foto paket + carousel, check-in QR, revalidatePath

## Fitur QR Check-in (2 mode)

Mode QR diatur **per event**:

| Mode | Cara kerja |
| --- | --- |
| `PER_TAMU` (default) | QR pribadi tiap tamu di undangan digitalnya. Petugas scan di pintu masuk. Anti check-in ganda. |
| `SATU_QR` | Satu QR master acara. Tamu scan sendiri → `/checkin/[eventToken]` → tulis nama (autocomplete) → kehadiran tercatat. Nama di luar daftar jadi walk-in. |

### Skema baru (`prisma/schema.prisma`)

- `Event.modeQr` — `PER_TAMU` | `SATU_QR`
- `Event.eventToken` — token unik acara untuk QR master
- `CheckIn.sumber` — `PETUGAS` | `MANDIRI`
- `CheckIn.petugasId` — opsional (check-in mandiri tanpa petugas)
- `WalkIn` — model baru: tamu di luar daftar yang check-in mandiri

### File baru

- `lib/qrmode.ts` — konstanta + label mode QR
- `lib/actions/qrmode.ts` — `setModeQrAction`, `regenerateEventTokenAction`
- `app/checkin/[eventToken]/page.tsx` — halaman check-in mandiri tamu (publik)
- `app/api/self-checkin/route.ts` — API check-in mandiri + daftar tamu (GET)
- `app/api/qr-acara/[eventToken]/route.ts` — PNG QR master
- `components/mode-qr-panel.tsx` — panel pilih mode + QR master
- `components/self-checkin-form.tsx` — form check-in tamu (autocomplete + kamera)
- `loading.tsx` di semua route — skeleton agar navigasi terasa instan

### Jebakan yang sudah ditemukan

- File ber-`"use server"` **hanya boleh export fungsi async**. Konstanta/label mode QR
  ditaruh di `lib/qrmode.ts`. Kalau di `lib/actions/qrmode.ts`, build gagal:
  `A "use server" file can only export async functions, found object`.
- Kamera hanya jalan di HTTPS atau localhost. Buka dari HP via `http://192.168.x.x:3000`
  diblokir browser → pakai `npx localtunnel --port 3000` atau deploy HTTPS.

### Perbaikan performa

- `next.config.ts`: `turbopack.root` di-set ke `__dirname` — tanpa ini Next memindai
  `D:\kuliahunpam\KP` yang isinya zip 1.9GB + 428MB dan jadi lambat.
- `lib/prisma.ts`: singleton + `$disconnect` handler untuk cegah kebocoran koneksi hot-reload.
- `CopyButton` pakai state lokal, bukan `window.alert` (alert memblokir event loop → terasa freeze).

## Catatan Lingkungan

- `npm` (ps1) diblokir Execution Policy → pakai `npm.cmd`
- Jalankan dev server dengan `Start-Process` agar tidak memblokir shell
- Database SQLite lokal, seed di `prisma/seed.mjs` (`npm.cmd run db:seed`)
- Build produksi: `npm.cmd run build` lalu `npm.cmd run start`
- Backup DB: `Copy-Item prisma\dev.db ...` sebelum `db:push`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

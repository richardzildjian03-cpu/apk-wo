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

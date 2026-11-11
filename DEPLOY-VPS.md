# Deploy DekorLamaran ke VPS

Panduan lengkap dari nol sampai jalan dengan HTTPS. Diuji untuk **Ubuntu/Debian**.
Aplikasi memakai **SQLite** — cocok untuk VPS karena file database tersimpan permanen.

---

## 1. Spesifikasi VPS Minimum

| Komponen | Minimum | Disarankan |
|---|---|---|
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04 | Ubuntu 24.04 |

> `npm run build` butuh RAM. Kalau RAM hanya 1 GB, tambahkan swap (lihat bagian 8).

---

## 2. Masuk ke VPS

```bash
ssh root@IP_VPS_ANDA
```

Buat user non-root (praktik aman):

```bash
adduser wo
usermod -aG sudo wo
su - wo
```

---

## 3. Pasang Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
node -v      # harus v20.x
npm -v
```

---

## 4. Ambil Kode Aplikasi

**Cara A — dari GitHub (disarankan)**

```bash
cd /var/www
sudo git clone https://github.com/richardzildjian03-cpu/apk-wo.git dekorlamaran
sudo chown -R $USER:$USER /var/www/dekorlamaran
cd /var/www/dekorlamaran
```

> Repo GitHub ini **langsung berisi projek** (tidak ada folder `wo-app/` di dalamnya),
> jadi `package.json` sudah berada tepat di `/var/www/dekorlamaran`. Verifikasi:
> ```bash
> ls      # harus terlihat package.json, app/, prisma/, next.config.ts
> ```

**Cara B — upload ZIP**

```bash
# dari komputer lokal:
scp dekorlamaran.zip wo@IP_VPS:/var/www/
# di VPS:
cd /var/www && unzip dekorlamaran.zip && mv wo-app dekorlamaran && cd dekorlamaran
```

---

## 5. Buat File `.env`

```bash
cd /var/www/dekorlamaran
cp .env.example .env
nano .env
```

Isi yang **wajib** disesuaikan:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="hasil-openssl-rand-base64-48"
APP_URL="https://wo.domainanda.com"
```

Buat `AUTH_SECRET` acak:

```bash
openssl rand -base64 48
```

> **Penting:** `APP_URL` dipakai untuk membuat tautan undangan dan isi QR.
> Kalau salah, QR akan berisi alamat yang tidak bisa dibuka. Setelah mengubah
> `APP_URL`, wajib `npm run build` ulang lalu restart.

Kalau memakai IP tanpa domain:

```env
APP_URL="http://203.0.113.10:3000"
```

---

## 6. Install Dependensi & Siapkan Database

```bash
cd /var/www/dekorlamaran
npm ci                     # install sesuai package-lock.json
npx prisma generate        # siapkan Prisma Client
npx prisma db push         # buat tabel di SQLite
```

Isi data awal (akun demo + contoh event):

```bash
npm run db:seed
```

> Kalau `db:seed` menolak karena data sudah ada, lewati saja — artinya database
> sudah terisi.

Siapkan folder upload (foto paket & logo) agar bisa ditulis aplikasi:

```bash
mkdir -p public/uploads/paket public/uploads/settings
chmod -R 755 public/uploads
```

> Folder ini **harus ikut di-backup** karena berisi foto yang di-upload dari
> aplikasi, bukan dari repo.

---

## 7. Build untuk Produksi

```bash
npm run build
```

Kalau berhasil, akan muncul daftar rute (ƒ /dashboard, ƒ /undangan/[token], dst.)
dan folder `.next` terbentuk.

---

## 8. Jalankan Aplikasi dengan PM2

PM2 membuat aplikasi hidup terus dan otomatis restart bila crash / VPS reboot.

```bash
sudo npm install -g pm2
mkdir -p /var/www/dekorlamaran/logs
cd /var/www/dekorlamaran
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # ikuti perintah yang muncul, jalankan sebagai sudo
```

Perintah harian:

```bash
pm2 status
pm2 logs dekorlamaran
pm2 restart dekorlamaran
```

Uji dari dalam VPS:

```bash
curl -I http://127.0.0.1:3000
# harus HTTP/1.1 200 OK
```

---

## 9. Pasang Nginx sebagai Reverse Proxy

```bash
sudo cp /var/www/dekorlamaran/deploy/nginx.conf /etc/nginx/sites-available/dekorlamaran
sudo nano /etc/nginx/sites-available/dekorlamaran     # ganti wo.domainanda.com
sudo ln -s /etc/nginx/sites-available/dekorlamaran /etc/nginx/sites-enabled/
sudo nginx -t            # pastikan "syntax is ok"
sudo systemctl reload nginx
```

Arahkan domain Anda (DNS A record) ke IP VPS.

---

## 10. Pasang HTTPS (WAJIB untuk kamera HP)

Browser HP memblokir kamera pada HTTP biasa. Tanpa HTTPS, tombol "Mulai Scan"
tidak akan berfungsi di HP tamu/petugas.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wo.domainanda.com
```

Certbot otomatis memperbarui sertifikat. Uji perpanjangan:

```bash
sudo certbot renew --dry-run
```

Setelah HTTPS aktif, pastikan `.env` memakai `https://`:

```env
APP_URL="https://wo.domainanda.com"
```

Lalu **wajib** build & restart:

```bash
cd /var/www/dekorlamaran
npm run build
pm2 restart dekorlamaran
```

---

## 11. Buka Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Port 3000 **tidak** perlu dibuka ke publik — Nginx yang meneruskan.

---

## 12. Verifikasi Setelah Deploy

Buka di browser:

| URL | Harapan |
|---|---|
| `https://wo.domainanda.com` | Halaman login tampil |
| `https://wo.domainanda.com/login` | Login `bos@wo.id` / `password123` |
| Menu Event → buka event | Daftar tamu tampil |
| Halaman undangan tamu | Undangan + tombol Check-in |
| Klik "Konfirmasi Kehadiran" | Notifikasi melayang muncul di atas layar |
| Scan QR dari HP | Kamera aktif, check-in tercatat |

Cek isi QR benar-benar memakai domain (bukan localhost):

```bash
curl -s "https://wo.domainanda.com/api/qr/TOKEN_TAMU" -o /tmp/qr.png
# lalu decode / buka gambarnya — isi QR harus https://wo.domainanda.com/undangan/...
```

---

## 13. Update Aplikasi di Kemudian Hari

```bash
cd /var/www/dekorlamaran
git pull origin main
npm ci
npx prisma generate
npx prisma db push          # aman, tidak menghapus data
npm run build
pm2 restart dekorlamaran
```

**Backup database dulu sebelum update:**

```bash
cp prisma/dev.db prisma/dev.db.backup-$(date +%F)
```

---

## 14. Backup Rutin (Disarankan)

Database SQLite berupa satu file: `prisma/dev.db`. Backup harian:

```bash
crontab -e
```

Tambahkan:

```
0 2 * * * cp /var/www/dekorlamaran/prisma/dev.db /var/backups/dekorlamaran-$(date +\%F).db
0 3 * * 0 find /var/backups -name "dekorlamaran-*.db" -mtime +30 -delete
```

Backup juga folder upload:

```bash
tar -czf /var/backups/uploads-$(date +%F).tar.gz /var/www/dekorlamaran/public/uploads
```

---

## 15. Pemecahan Masalah

### Foto upload tidak muncul (404)

Aplikasi menyajikan file upload lewat rute `/uploads/[...path]`, jadi foto yang
di-upload setelah build tetap tampil. Kalau masih 404:

```bash
ls -l public/uploads/paket          # pastikan file benar-benar ada
sudo chown -R $USER:$USER public/uploads
chmod -R 755 public/uploads
pm2 restart dekorlamaran
```

Pastikan juga kode sudah versi terbaru (ada folder `app/uploads/`):

```bash
git pull origin main
npm run build && pm2 restart dekorlamaran
```

### Build gagal karena kehabisan RAM

Gejala: `Killed` atau `JavaScript heap out of memory`.

```bash
# tambah swap 2 GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Lalu build ulang:

```bash
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

### Port 3000 sudah dipakai

```bash
sudo lsof -i :3000
pm2 restart dekorlamaran
```

### Halaman 502 Bad Gateway

Aplikasi mati. Cek:

```bash
pm2 logs dekorlamaran --lines 50
```

### QR berisi `localhost`

`APP_URL` belum diset dengan benar. Perbaiki `.env`, lalu:

```bash
npm run build && pm2 restart dekorlamaran
```

### Kamera tidak aktif di HP

- Pastikan dibuka lewat `https://` (bukan `http://` atau IP)
- Beri izin kamera di browser
- Coba Chrome/Safari terbaru

### Lupa password akun

```bash
cd /var/www/dekorlamaran
node -e "const b=require('bcryptjs');console.log(b.hashSync('passwordbaru',10))"
# salin hash, lalu:
# npx prisma studio  (jika ingin edit lewat GUI)
```

---

## 16. Daftar Perintah Cepat

```bash
pm2 status                        # status aplikasi
pm2 logs dekorlamaran             # lihat log
pm2 restart dekorlamaran          # restart
pm2 stop dekorlamaran             # hentikan
pm2 delete dekorlamaran           # hapus dari PM2
sudo systemctl reload nginx       # reload nginx
sudo nginx -t                     # tes konfigurasi nginx
sudo certbot renew --dry-run      # tes perpanjangan SSL
```

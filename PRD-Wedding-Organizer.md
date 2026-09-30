# PRD — Aplikasi Web Wedding Organizer (WO)

| Info | Detail |
|---|---|
| Nama Produk | DekorLamaran |
| Tipe Produk | Aplikasi Web |
| Status Dokumen | Draft v1.1 (Revisi Scope) |
| Tanggal | 23 September 2026 |
| Penulis | — |

---

## 1. Ringkasan Produk

Aplikasi web terpadu untuk bisnis Wedding Organizer yang menghubungkan tiga sisi dalam satu platform:

1. **Sisi Internal WO** — bos, leader, dan staf mengelola jadwal/rundown event, vendor, dan laporan kehadiran tamu.
2. **Sisi Klien (Pengantin)** — pasangan pengantin mengelola data pengantin, keluarga kedua pihak, dan daftar tamu (VIP/regular), mengirim undangan digital berbasis QR, serta memantau rekap tamu yang hadir dan mengunduhnya.
3. **Sisi Tamu** — tamu menerima undangan digital berisi QR code pribadi dan melakukan konfirmasi kehadiran (RSVP) tanpa perlu login.

---

## 2. Latar Belakang & Masalah

Pengelolaan Wedding Organizer secara manual (WhatsApp, spreadsheet, catatan kertas) menimbulkan masalah:

- Data klien, keluarga pengantin, dan tamu tersebar dan tidak terpusat.
- Proses RSVP tamu lambat, rawan salah catat kehadiran, dan tidak bisa membedakan tamu VIP dari tamu regular.
- Rekap kehadiran tamu harus dihitung manual oleh tim WO dan tidak dapat dilihat langsung oleh pengantin.
- Jadwal/rundown dan penugasan vendor tidak terdokumentasi rapi sehingga rawan miskomunikasi tim.

---

## 3. Tujuan & Sasaran

### Tujuan Bisnis
- Memusatkan seluruh operasional WO (jadwal, vendor, event) dalam satu sistem.
- Mengotomasi undangan digital dan RSVP tamu via QR code.
- Menyediakan laporan kehadiran tamu per event secara otomatis (export Excel/PDF).
- Memberikan pengalaman klien (pengantin) yang lebih baik: data keluarga & tamu terpusat, rekap kehadiran dapat dipantau dan diunduh sendiri.

### Sasaran Terukur (KPI)
- ≥ 80% tamu melakukan RSVP melalui sistem (bukan manual via WA).
- 100% event tercatat di sistem (tidak ada event di luar sistem).
- Laporan kehadiran tamu per event tersedia otomatis tanpa rekap manual.
- Waktu pembuatan undangan digital < 5 menit per event (setelah data tamu diinput).

---

## 4. Pengguna & Peran (Roles)

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Bos (Owner)** | Pemilik bisnis WO | Melihat semua event, jadwal, vendor, dan laporan kehadiran tamu seluruh event |
| **Leader WO** | Koordinator event/wedding | Kelola event yang diampu: jadwal/rundown, penugasan vendor, dan lihat data tamu per event |
| **Staff Admin** | Staf operasional | Membuat event, mengelola data klien, paket (referensi internal), vendor, dan jadwal |
| **Klien (Pengantin)** | Pasangan pengantin (klien WO) | Mengelola data pengantin, keluarga kedua pihak, daftar tamu (VIP/regular), mengirim undangan QR, serta melihat & mengunduh rekap tamu yang hadir |

> **Catatan:**
> - **Tamu bukan role/login.** Tamu hanya menerima undangan digital berisi QR code pribadi dan melakukan RSVP via tautan unik tanpa akun.
> - **Vendor bukan role/login.** Vendor adalah data yang dikelola internal (CRUD + penugasan ke event). Konfirmasi ketersediaan vendor dicatat manual oleh staf/leader.

### Hierarki Internal
```
Bos (Owner)
 └── Leader WO (koordinator per event)
      └── Staff Admin
```

---

## 5. Ruang Lingkup

### Dalam Lingkup (In Scope)
- Autentikasi multi-role (bos, leader, staff admin, klien pengantin).
- Manajemen event: dibuat manual oleh Staff Admin (tidak ada booking mandiri oleh klien).
- Manajemen jadwal/rundown per event.
- Manajemen vendor (CRUD + penugasan ke event).
- Laporan kehadiran tamu per event (export Excel/PDF).
- Manajemen data pengantin, keluarga kedua pihak, dan tamu (termasuk status VIP/regular).
- Undangan digital dengan QR code unik per tamu + RSVP tanpa login.
- Klien dapat melihat rekap tamu yang hadir dan mengunduhnya.
- Check-in tamu via scan QR oleh petugas (leader/staff) pada hari-H, dengan anti check-in ganda dan pembatalan (revert).

### Luar Lingkup (Out of Scope) — v1
- Aplikasi mobile native (web responsif saja di v1).
- Katalog paket publik & booking mandiri oleh klien.
- Pencatatan pembayaran & laporan keuangan.
- Portal/login vendor.

---

## 6. Kebutuhan Fungsional

### 6.1 Autentikasi & Manajemen User
- **FR-AUTH-01**: Akun internal (bos, leader, staff admin) dan akun klien (pengantin) dibuat oleh Staff Admin; tidak ada registrasi mandiri. Kredensial klien diserahkan oleh WO saat event dibuat.
- **FR-AUTH-02**: Login dengan email/password + lupa password.
- **FR-AUTH-03**: Hak akses berbasis role (RBAC) sesuai tabel peran di Bagian 4.
- **FR-AUTH-04**: Tamu tidak perlu login — mengakses undangan via tautan unik/QR.

### 6.2 Manajemen Paket (Referensi Internal)
- **FR-PKG-01**: Staff Admin dapat CRUD paket (nama, deskripsi, include/exclude, harga, foto, kapasitas).
- **FR-PKG-02**: Paket digunakan sebagai referensi saat pembuatan event oleh Staff Admin (paket utuh atau custom).
- **FR-PKG-03**: Data paket hanya terlihat oleh internal WO (bukan katalog publik).
- **FR-PKG-04**: Staff Admin dapat mengunggah, mengganti, dan menghapus gambar paket (format JPG/PNG/WebP, maksimal 4MB) yang ditampilkan pada kartu paket di dashboard internal.

### 6.3 Manajemen Event (Manual oleh Admin)
- **FR-EVT-01**: Staff Admin membuat event: pilih klien (akun pengantin), paket, tanggal acara, lokasi, dan data pengantin (nama lengkap kedua pihak, nomor HP, email).
- **FR-EVT-02**: Event memiliki status: `Draft → Aktif → Selesai` (atau `Dibatalkan`).
- **FR-EVT-03**: Leader WO ditugaskan ke event oleh bos/admin.
- **FR-EVT-04**: Sistem memberi warning jika terdapat event lain pada tanggal yang sama dengan leader yang sama.

### 6.4 Dashboard Internal
- **FR-INT-01**: Dashboard bos: ringkasan semua event (aktif, bulan ini, selesai), jadwal mendatang, dan akses laporan kehadiran tamu seluruh event.
- **FR-INT-02**: Dashboard leader: daftar event yang diampu, rundown, dan data tamu per event.
- **FR-INT-03**: Manajemen vendor: CRUD vendor (nama, kategori layanan, kontak), penugasan vendor ke event, dan pencatatan status konfirmasi vendor (dicatat manual oleh staf/leader).
- **FR-INT-04**: Manajemen jadwal/rundown: timeline acara per event (akad, resepsi, seserahan, dst) beserta PIC.
- **FR-INT-05**: Laporan kehadiran tamu per event: rekap RSVP (hadir/tidak/belum pasti), rincian VIP vs regular, total kursi — dapat diexport ke Excel/PDF.

### 6.5 Manajemen Data Pengantin, Keluarga & Tamu
- **FR-GUEST-01**: Klien dapat menginput data kedua pengantin lengkap (nama panggilan, nama lengkap, anak ke-berapa, nama orang tua).
- **FR-GUEST-02**: Klien dapat menginput data keluarga kedua pihak (ayah, ibu, kakak/adik, dll) dengan label hubungan.
- **FR-GUEST-03**: Klien dapat menginput daftar tamu: nama, kategori (Keluarga Pengantin Pria / Keluarga Pengantin Wanita / Teman / Kolega), status (VIP / Regular), jumlah kursi/rombongan, nomor WA.
- **FR-GUEST-04**: Import tamu massal via template Excel/CSV.
- **FR-GUEST-05**: Tamu VIP ditandai khusus (misal: rombongan keluarga inti, pejabat, sesepuh) untuk keperluan protokoler.
- **FR-GUEST-06**: Klien dapat melihat rekap tamu yang hadir (berdasarkan RSVP) beserta detailnya dan mengunduhnya dalam format Excel/PDF.

### 6.6 Undangan Digital & QR Code
- **FR-INV-01**: Sistem menghasilkan halaman undangan digital per event berisi: nama kedua pengantin, foto, data keluarga kedua pihak (opsional), tanggal/waktu/lokasi, Google Maps link, dress code, galeri.
- **FR-INV-02**: Setiap tamu mendapat QR code unik yang tergenerate otomatis saat data tamu ditambahkan.
- **FR-INV-03**: Klien dapat mengirim undangan + QR ke tamu via link WhatsApp (share) atau download gambar QR.
- **FR-INV-04**: QR bersifat personal: memuat nama tamu, kategori, status VIP/regular, dan jumlah kursi.
- **FR-INV-05**: Undangan hanya valid untuk event terkait dan tidak dapat dipindaikan ke tamu lain (anti penyalahgunaan; QR invalid jika tamu dihapus).

### 6.7 RSVP & Check-in Kehadiran
- **FR-RSVP-01**: Tamu dapat konfirmasi kehadiran (hadir/tidak/belum pasti) beserta jumlah orang dari halaman undangan, tanpa login.
- **FR-RSVP-02**: Setiap perubahan RSVP tercatat (timestamp) dan terlihat oleh klien & leader.
- **FR-RSVP-03**: Leader/staff dapat melihat rekap RSVP per event terkini dari dashboard internal.
- **FR-RSVP-04**: Petugas (leader/staff) dapat scan QR tamu saat acara menggunakan kamera perangkat pada halaman check-in.
- **FR-RSVP-05**: Hasil scan menampilkan: nama tamu, status VIP/regular, jumlah kursi, dan status RSVP — check-in tercatat otomatis.
- **FR-RSVP-06**: QR yang sudah discan tidak dapat digunakan lagi (anti check-in ganda); tersedia input manual (token/tautan) dan pembatalan check-in (revert) oleh petugas jika salah scan.
- **FR-RSVP-07**: Counter kehadiran (sudah/belum check-in, VIP) tersedia di halaman check-in dan diperbarui setelah setiap scan.

### 6.8 Notifikasi
- **FR-NOTIF-01**: Notifikasi in-app untuk role internal & klien (event dibuat, RSVP tamu, penugasan leader/vendor).
- **FR-NOTIF-02**: Pengingat jadwal (H-30, H-7, H-1) untuk klien dan tim internal.
- **FR-NOTIF-03**: (v2) Integrasi WhatsApp notification.

---

## 7. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | Halaman undangan dimuat < 3 detik; proses check-in scan < 2 detik; dukung 500+ tamu per event |
| Keamanan | Password hashed (bcrypt), QR token unik & tidak dapat ditebak, data tamu hanya terlihat oleh klien terkait & internal WO, HTTPS |
| Privasi | Data pengantin/keluarga/tamu tidak dibagikan lintas event; tamu hanya melihat acaranya sendiri |
| Kompatibilitas | Web responsif (desktop, tablet, mobile); kamera QR scanner berfungsi di browser mobile (Chrome/Safari) via HTTPS atau localhost |
| Ketersediaan | Uptime 99% terutama menjelang tanggal acara |
| Audit | Log aktivitas perubahan RSVP, perubahan status event, dan penugasan vendor |
| Skalabilitas | Mendukung multi-event paralel dan pertumbuhan tamu hingga ribuan |

---

## 8. Alur Pengguna Utama

### 8.1 Alur Pembuatan Event (Staff Admin)
```
Staff Admin login → Buat event (pilih/buat akun klien, paket, tanggal, lokasi,
data pengantin) → Assign Leader WO → Status: Aktif → Kredensial akun diserahkan ke klien
```

### 8.2 Alur Undangan & RSVP (Klien → Tamu)
```
Event aktif → Klien input keluarga & tamu (VIP/regular) → QR otomatis dibuat
→ Klien share undangan + QR via WA → Tamu buka undangan → RSVP (hadir/tidak)
→ Klien & Leader lihat rekap RSVP
```

### 8.3 Alur Check-in (H-day, Petugas)
```
Petugas (leader/staff) login → Buka halaman Check-in Tamu pada event → Tekan "Mulai Scan"
→ Arahkan kamera ke QR tamu → Sistem tampil: nama, VIP/regular, kursi, RSVP
→ Check-in tercatat (anti ganda) → Counter & log diperbarui
→ Jika salah scan → Batalkan (revert) → Tamu dapat check-in ulang
```

### 8.4 Alur Internal (Bos)
```
Bos login → Dashboard → Lihat event aktif & jadwal bulan ini
→ Cek penugasan vendor → Buka laporan kehadiran tamu → Unduh laporan
```

---

## 9. Model Data (Entitas Utama)

| Entitas | Atribut Kunci |
|---|---|
| **User** | id, nama, email, password (hash), role (bos/leader/staff/klien), no_hp |
| **Paket** | id, nama, deskripsi, harga, include[], foto[], status |
| **Event** | id, klien_id, paket_id, leader_id, tanggal, lokasi, status |
| **Pengantin** | event_id, nama_lengkap, nama_panggilan, pihak (pria/wanita), anak_ke, nama_ortu |
| **Keluarga** | event_id, nama, hubungan, pihak (pria/wanita) |
| **Tamu** | id, event_id, nama, kategori, status (VIP/regular), jumlah_kursi, no_wa |
| **QRCode** | tamu_id, token unik, status_aktif |
| **RSVP** | tamu_id, status (hadir/tidak/belum pasti), jumlah_hadir, timestamp |
| **CheckIn** | tamu_id, petugas_id, waktu_check_in |
| **Vendor** | id, nama, kategori_layanan, kontak |
| **PenugasanVendor** | event_id, vendor_id, status_konfirmasi |
| **Rundown** | event_id, waktu, kegiatan, PIC |

---

## 10. Prioritas & Roadmap

| Fase | Fitur | Prioritas |
|---|---|---|
| **MVP (v1.0)** | Auth 4 role (bos, leader, staff admin, klien), manajemen event manual, manajemen paket (internal), jadwal/rundown, manajemen vendor + penugasan, data pengantin & keluarga, manajemen tamu + VIP, undangan digital + QR, RSVP tanpa login, rekap kehadiran + export Excel/PDF (internal & klien), check-in scan QR + counter + log | Wajib |
| **v1.1** | Notifikasi in-app, pengingat jadwal, import tamu massal, log audit | Tinggi |
| **v2.0** | Pencatatan pembayaran & laporan keuangan, portal vendor (login), integrasi WhatsApp notif, template undangan custom | Menengah |

---

## 11. Metrik Sukses

- Semua event WO tercatat di sistem dalam 3 bulan pertama.
- ≥ 80% tamu RSVP via sistem.
- Laporan kehadiran tamu per event tersedia otomatis tanpa rekap manual.
- Klien dapat mengunduh rekap kehadiran sendiri tanpa bantuan tim WO.
- NPS klien (pengantin) ≥ 8/10 untuk kemudahan koordinasi & undangan digital.

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Tamu tidak paham QR / tidak punya smartphone | Sediakan cetakan QR kartu nama tamu; tamu dapat RSVP dibantu oleh klien/panitia |
| QR disebar ke orang lain | QR memuat nama tamu; petugas memverifikasi nama tamu saat check-in |
| Klien salah input data keluarga/tamu | Edit data sebelum hari-H; QR regenerate otomatis |
| Beban server saat event besar | Load testing 1000 QR; kompresi gambar undangan |
| Tamu lupa/enggan RSVP | Pengingat otomatis & tombol share ulang undangan oleh klien |
| Koneksi internet buruk saat H-day | Halaman check-in ringan; tersedia input manual token; opsi offline-mode (v2) |

---

## 13. Glosarium

| Istilah | Arti |
|---|---|
| RSVP | Répondez s'il vous plaît — konfirmasi kehadiran tamu |
| VIP Guest | Tamu dengan protokoler khusus (keluarga inti, sesepuh, pejabat) |
| Rundown | Susunan timeline acara |
| H-day | Hari acara (hari pernikahan) |
| PIC | Person in charge / penanggung jawab |

---

## 14. Pertanyaan Terbuka

1. Apakah undangan digital perlu mendukung kustomisasi tema per event (di luar template default)?
2. Apakah tamu VIP perlu fitur tambahan (misal: seat number khusus, hadiah souvenir tercatat)?
3. Apakah perlu multi-branch WO (bos memiliki beberapa cabang)?
4. Apakah klien dapat menambah tamu sendiri setelah H-3 (batas waktu)? Batas waktunya kapan?
5. Apakah klien juga perlu melihat rundown acara dari sisi portalnya, atau hanya internal WO?

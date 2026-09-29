import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const token = () => randomBytes(10).toString("hex");
const hash = (pw) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log("Seeding database...");

  const bos = await prisma.user.create({
    data: {
      nama: "Bos WO",
      email: "bos@wo.id",
      passwordHash: hash("password123"),
      role: "BOS",
      noHp: "081200000001",
    },
  });

  const leader = await prisma.user.create({
    data: {
      nama: "Leader WO",
      email: "leader@wo.id",
      passwordHash: hash("password123"),
      role: "LEADER",
      noHp: "081200000002",
    },
  });

  const staff = await prisma.user.create({
    data: {
      nama: "Staff Admin",
      email: "staff@wo.id",
      passwordHash: hash("password123"),
      role: "STAFF",
      noHp: "081200000003",
    },
  });

  const klien1 = await prisma.user.create({
    data: {
      nama: "Rina & Dedi",
      email: "klien@wo.id",
      passwordHash: hash("password123"),
      role: "KLIEN",
      noHp: "081200000004",
    },
  });

  const klien2 = await prisma.user.create({
    data: {
      nama: "Sari & Budi",
      email: "klien2@wo.id",
      passwordHash: hash("password123"),
      role: "KLIEN",
      noHp: "081200000005",
    },
  });

  const paketGold = await prisma.paket.create({
    data: {
      nama: "Paket Gold",
      deskripsi: "Paket pernikahan lengkap dengan dekorasi premium, katering 500 porsi, MUA, fotografi, dan dokumentasi sinematik.",
      harga: 150000000,
      includeList: "Dekorasi Premium,Katering 500 Porsi,MUA,Fotografi & Videografi,GA & Sound System,Wedding Coordinator",
      kapasitas: 500,
    },
  });

  await prisma.paket.create({
    data: {
      nama: "Paket Silver",
      deskripsi: "Paket pernikahan standar dengan dekorasi, katering 300 porsi, dan dokumentasi foto.",
      harga: 85000000,
      includeList: "Dekorasi Standar,Katering 300 Porsi,Fotografi,Sound System",
      kapasitas: 300,
    },
  });

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { nama: "Dekorasi Melati", kategoriLayanan: "Dekorasi", kontak: "081311112222" } }),
    prisma.vendor.create({ data: { nama: "Katering Selera Rasa", kategoriLayanan: "Katering", kontak: "081322223333" } }),
    prisma.vendor.create({ data: { nama: "MUA Ayu Bridal", kategoriLayanan: "Makeup", kontak: "081333334444" } }),
    prisma.vendor.create({ data: { nama: "Foto Cahaya Studio", kategoriLayanan: "Fotografi", kontak: "081344445555" } }),
    prisma.vendor.create({ data: { nama: "Sound Harmoni", kategoriLayanan: "GA & Sound", kontak: "081355556666" } }),
  ]);

  const event1 = await prisma.event.create({
    data: {
      namaAcara: "Pernikahan Rina & Dedi",
      klienId: klien1.id,
      paketId: paketGold.id,
      leaderId: leader.id,
      tanggal: new Date("2026-10-18T08:00:00"),
      lokasi: "Balai Sarbini, Jakarta Selatan",
      status: "AKTIF",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      namaAcara: "Pernikahan Sari & Budi",
      klienId: klien2.id,
      leaderId: leader.id,
      tanggal: new Date("2026-05-10T09:00:00"),
      lokasi: "Gedung Kartika, Tangerang",
      status: "SELESAI",
    },
  });

  await prisma.pengantin.createMany({
    data: [
      {
        eventId: event1.id,
        namaLengkap: "Dedi Kurniawan, S.Kom",
        namaPanggilan: "Dedi",
        pihak: "PRIA",
        anakKe: 1,
        namaOrtu: "Bpk. Kurniawan & Ibu Siti",
      },
      {
        eventId: event1.id,
        namaLengkap: "Rina Marlina, S.E",
        namaPanggilan: "Rina",
        pihak: "WANITA",
        anakKe: 2,
        namaOrtu: "Bpk. Marlina & Ibu Rahma",
      },
      {
        eventId: event2.id,
        namaLengkap: "Budi Santoso",
        namaPanggilan: "Budi",
        pihak: "PRIA",
        anakKe: 1,
        namaOrtu: "Bpk. Santoso & Ibu Wati",
      },
      {
        eventId: event2.id,
        namaLengkap: "Sari Rahmawati",
        namaPanggilan: "Sari",
        pihak: "WANITA",
        anakKe: 1,
        namaOrtu: "Bpk. Rahmat & Ibu Dewi",
      },
    ],
  });

  await prisma.keluarga.createMany({
    data: [
      { eventId: event1.id, nama: "Bpk. Kurniawan", hubungan: "Ayah", pihak: "PRIA" },
      { eventId: event1.id, nama: "Ibu Siti", hubungan: "Ibu", pihak: "PRIA" },
      { eventId: event1.id, nama: "Rizky Kurniawan", hubungan: "Kakak", pihak: "PRIA" },
      { eventId: event1.id, nama: "Bpk. Marlina", hubungan: "Ayah", pihak: "WANITA" },
      { eventId: event1.id, nama: "Ibu Rahma", hubungan: "Ibu", pihak: "WANITA" },
      { eventId: event1.id, nama: "Dewi Marlina", hubungan: "Kakak", pihak: "WANITA" },
    ],
  });

  const tamu1 = [
    { nama: "Bpk. H. Ahmad Subarjo", kategori: "KOLEGA", status: "VIP", jumlahKursi: 2, noWa: "081370001111", rsvp: { status: "HADIR", jumlahHadir: 2 } },
    { nama: "Ibu Hj. Fatimah", kategori: "KELUARGA_PRIA", status: "VIP", jumlahKursi: 2, noWa: "081370002222", rsvp: { status: "HADIR", jumlahHadir: 2 } },
    { nama: "Keluarga Bpk. Joko", kategori: "KELUARGA_WANITA", status: "VIP", jumlahKursi: 4, noWa: "081370003333", rsvp: null },
    { nama: "Andi Pratama", kategori: "TEMAN", status: "REGULAR", jumlahKursi: 1, noWa: "081370004444", rsvp: { status: "HADIR", jumlahHadir: 1 } },
    { nama: "Sinta Dewi", kategori: "TEMAN", status: "REGULAR", jumlahKursi: 1, noWa: "081370005555", rsvp: null },
    { nama: "Keluarga Wijaya", kategori: "KELUARGA_PRIA", status: "REGULAR", jumlahKursi: 3, noWa: "081370006666", rsvp: { status: "TIDAK", jumlahHadir: 0 } },
    { nama: "Rudi Hartono", kategori: "KOLEGA", status: "REGULAR", jumlahKursi: 1, noWa: "081370007777", rsvp: null },
    { nama: "Maya Sari", kategori: "TEMAN", status: "REGULAR", jumlahKursi: 1, noWa: "081370008888", rsvp: { status: "HADIR", jumlahHadir: 1 } },
  ];

  for (const t of tamu1) {
    const tamu = await prisma.tamu.create({
      data: {
        eventId: event1.id,
        nama: t.nama,
        kategori: t.kategori,
        status: t.status,
        jumlahKursi: t.jumlahKursi,
        noWa: t.noWa,
        qrToken: token(),
      },
    });
    if (t.rsvp) {
      await prisma.rsvp.create({ data: { tamuId: tamu.id, ...t.rsvp } });
    }
  }

  const tamu2 = [
    { nama: "Bpk. Hadi", kategori: "KELUARGA_PRIA", status: "VIP", jumlahKursi: 2, rsvp: { status: "HADIR", jumlahHadir: 2 } },
    { nama: "Lina", kategori: "TEMAN", status: "REGULAR", jumlahKursi: 1, rsvp: { status: "HADIR", jumlahHadir: 1 } },
    { nama: "Keluarga Saputra", kategori: "KELUARGA_WANITA", status: "REGULAR", jumlahKursi: 3, rsvp: { status: "TIDAK", jumlahHadir: 0 } },
  ];

  for (const t of tamu2) {
    const tamu = await prisma.tamu.create({
      data: {
        eventId: event2.id,
        nama: t.nama,
        kategori: t.kategori,
        status: t.status,
        jumlahKursi: t.jumlahKursi,
        qrToken: token(),
      },
    });
    if (t.rsvp) {
      await prisma.rsvp.create({ data: { tamuId: tamu.id, ...t.rsvp } });
    }
  }

  await prisma.penugasanVendor.createMany({
    data: [
      { eventId: event1.id, vendorId: vendors[0].id, statusKonfirmasi: "DIKONFIRMASI" },
      { eventId: event1.id, vendorId: vendors[1].id, statusKonfirmasi: "DIKONFIRMASI" },
      { eventId: event1.id, vendorId: vendors[2].id, statusKonfirmasi: "MENUNGGU" },
      { eventId: event1.id, vendorId: vendors[3].id, statusKonfirmasi: "DIKONFIRMASI" },
      { eventId: event2.id, vendorId: vendors[4].id, statusKonfirmasi: "DIKONFIRMASI" },
    ],
  });

  await prisma.rundown.createMany({
    data: [
      { eventId: event1.id, waktu: "08:00", kegiatan: "Akad Nikah", pic: "Leader WO" },
      { eventId: event1.id, waktu: "10:00", kegiatan: "Sesi Foto Keluarga", pic: "Foto Cahaya Studio" },
      { eventId: event1.id, waktu: "11:00", kegiatan: "Musik Ritual / Seserahan", pic: "Staff Admin" },
      { eventId: event1.id, waktu: "12:00", kegiatan: "Resepsi Dimulai", pic: "Leader WO" },
      { eventId: event1.id, waktu: "13:00", kegiatan: "Makan Berjamuan", pic: "Katering Selera Rasa" },
      { eventId: event1.id, waktu: "15:00", kegiatan: "Penutupan & Ramah Tamah", pic: "Leader WO" },
    ],
  });

  console.log("Seed selesai.");
  console.log("Akun (password: password123):");
  console.log(`  BOS    : ${bos.email}`);
  console.log(`  LEADER : ${leader.email}`);
  console.log(`  STAFF  : ${staff.email}`);
  console.log(`  KLIEN  : ${klien1.email} / ${klien2.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

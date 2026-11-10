// Backfill: isi eventToken untuk event lama + set modeQr default PER_TAMU.
// Idempoten — aman dijalankan berulang.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function token() {
  return randomBytes(16).toString("hex");
}

const events = await prisma.event.findMany({
  select: { id: true, namaAcara: true, modeQr: true, eventToken: true },
});

let fixed = 0;
for (const e of events) {
  const needs = !e.eventToken || !e.modeQr;
  if (!needs) continue;
  await prisma.event.update({
    where: { id: e.id },
    data: {
      eventToken: e.eventToken ?? token(),
      modeQr: e.modeQr ?? "PER_TAMU",
    },
  });
  fixed++;
  console.log(`  #${e.id} ${e.namaAcara} → token diisi`);
}

console.log(`\nSelesai. ${events.length} event diperiksa, ${fixed} diperbarui.`);
await prisma.$disconnect();

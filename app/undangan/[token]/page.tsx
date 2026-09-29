import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/constants";
import { submitRsvpAction } from "@/lib/actions/guests";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge } from "@/components/ui";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const tamu = await prisma.tamu.findUnique({
    where: { qrToken: token },
    include: { event: { include: { pengantin: true } } },
  });
  if (!tamu) return { title: "Undangan" };
  return {
    title: `Undangan Pernikahan — ${tamu.event.namaAcara}`,
    description: `Undangan digital untuk ${tamu.nama}`,
  };
}

export default async function UndanganPage({ params }: Props) {
  const { token } = await params;

  const tamu = await prisma.tamu.findUnique({
    where: { qrToken: token },
    include: {
      event: { include: { pengantin: true, keluarga: { orderBy: [{ pihak: "asc" }, { nama: "asc" }] } } },
      rsvp: true,
    },
  });
  if (!tamu) notFound();

  const event = tamu.event;
  const pria = event.pengantin.find((p) => p.pihak === "PRIA");
  const wanita = event.pengantin.find((p) => p.pihak === "WANITA");
  const keluargaPria = event.keluarga.filter((k) => k.pihak === "PRIA");
  const keluargaWanita = event.keluarga.filter((k) => k.pihak === "WANITA");
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(event.lokasi)}`;

  if (event.status === "DIBATALKAN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50 px-4">
        <div className="card fade-in max-w-md text-center">
          <div className="card-body">
            <p className="inv-serif text-xl font-semibold text-zinc-900">Undangan Tidak Tersedia</p>
            <p className="mt-2 text-sm text-zinc-500">
              Mohon maaf, acara ini telah dibatalkan. Terima kasih atas perhatian Anda.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inv-hero min-h-screen">
      <div className="fade-in mx-auto max-w-md px-4 py-10">
        {/* Hero */}
        <section className="text-center">
          <p className="text-xs tracking-[0.35em] text-pink-400 uppercase">The Wedding Of</p>
          <h1 className="inv-script mt-4 text-5xl leading-tight text-pink-700">
            {wanita?.namaPanggilan ?? wanita?.namaLengkap ?? "Pengantin"}
          </h1>
          <p className="inv-serif my-2 text-2xl text-zinc-400">&amp;</p>
          <h1 className="inv-script text-5xl leading-tight text-pink-700">
            {pria?.namaPanggilan ?? pria?.namaLengkap ?? "Pengantin"}
          </h1>
          <p className="mt-6 text-sm text-zinc-500">{formatTanggal(event.tanggal)}</p>
          <p className="mt-1 text-sm text-zinc-500">{event.lokasi}</p>
        </section>

        <hr className="my-8 border-pink-200" />

        {/* Sapaan tamu */}
        <section className="rounded-2xl border border-pink-100 bg-white/80 p-6 text-center shadow-sm">
          <p className="text-xs tracking-[0.3em] text-pink-400 uppercase">Kepada Yth.</p>
          <p className="inv-serif mt-2 text-xl font-semibold text-zinc-900">{tamu.nama}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {tamu.status === "VIP" ? <Badge variant="violet">Tamu VIP</Badge> : null}
            <Badge variant="pink">{tamu.jumlahKursi} kursi</Badge>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            Dengan hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa
            restu pada acara pernikahan kami.
          </p>
        </section>

        {/* Mempelai */}
        <section className="mt-8 grid gap-4">
          {[pria, wanita].filter(Boolean).map((p) => (
            <div key={p!.id} className="rounded-2xl border border-pink-100 bg-white/80 p-5 text-center shadow-sm">
              <p className="inv-serif text-lg font-semibold text-zinc-900">{p!.namaLengkap}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {p!.pihak === "PRIA" ? "Calon Pengantin Pria" : "Calon Pengantin Wanita"}
              </p>
              {p!.namaOrtu ? (
                <p className="mt-2 text-xs text-zinc-500">Putra/putri dari {p!.namaOrtu}</p>
              ) : null}
              {p!.anakKe ? (
                <p className="text-xs text-zinc-400">Anak ke-{p!.anakKe}</p>
              ) : null}
            </div>
          ))}
        </section>

        {/* Keluarga */}
        {keluargaPria.length > 0 || keluargaWanita.length > 0 ? (
          <section className="mt-8">
            <p className="mb-3 text-center text-xs tracking-[0.3em] text-pink-400 uppercase">
              Keluarga Besar
            </p>
            <div className="grid gap-3">
              {keluargaPria.length > 0 ? (
                <div className="rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">
                    Pihak {pria?.namaPanggilan ?? "Pengantin Pria"}
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-700">
                    {keluargaPria.map((k) => (
                      <li key={k.id}>
                        {k.nama} <span className="text-xs text-zinc-400">({k.hubungan})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {keluargaWanita.length > 0 ? (
                <div className="rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">
                    Pihak {wanita?.namaPanggilan ?? "Pengantin Wanita"}
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-700">
                    {keluargaWanita.map((k) => (
                      <li key={k.id}>
                        {k.nama} <span className="text-xs text-zinc-400">({k.hubungan})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Detail acara */}
        <section className="mt-8 rounded-2xl border border-pink-100 bg-white/80 p-6 text-center shadow-sm">
          <p className="text-xs tracking-[0.3em] text-pink-400 uppercase">Rangkaian Acara</p>
          <p className="inv-serif mt-3 text-lg font-semibold text-zinc-900">{event.namaAcara}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(event.tanggal)}{" "}
            WIB
          </p>
          <p className="mt-1 text-sm text-zinc-600">{event.lokasi}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-4"
          >
            Lihat Lokasi (Google Maps)
          </a>
        </section>

        {/* QR Pribadi */}
        <section className="mt-8 rounded-2xl border border-pink-100 bg-white/80 p-6 text-center shadow-sm">
          <p className="text-xs tracking-[0.3em] text-pink-400 uppercase">QR Undangan Pribadi</p>
          <p className="mt-2 text-xs text-zinc-400">{tamu.nama}</p>
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${tamu.qrToken}`}
              alt={`QR ${tamu.nama}`}
              width={180}
              height={180}
              className="rounded-xl border border-pink-100"
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            QR ini bersifat pribadi atas nama <strong>{tamu.nama}</strong>. Tunjukkan QR ini
            kepada penerima tamu saat memasuki lokasi acara.
          </p>
        </section>

        {/* RSVP */}
        <section className="mt-8 rounded-2xl border border-pink-100 bg-white/80 p-6 shadow-sm">
          <p className="text-center text-xs tracking-[0.3em] text-pink-400 uppercase">
            Konfirmasi Kehadiran
          </p>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Mohon konfirmasi kehadiran Anda sebelum hari acara.
          </p>

          {tamu.rsvp ? (
            <div className="mt-4 rounded-lg bg-pink-50 px-4 py-3 text-center text-sm text-pink-700">
              Konfirmasi Anda saat ini:{" "}
              <strong>
                {tamu.rsvp.status === "HADIR"
                  ? `Hadir (${tamu.rsvp.jumlahHadir} orang)`
                  : "Tidak Hadir"}
              </strong>
              . Anda dapat mengubahnya di bawah.
            </div>
          ) : null}

          <ActionForm action={submitRsvpAction} className="mt-4 space-y-4">
            <input type="hidden" name="token" value={tamu.qrToken} />
            <div className="grid gap-2">
              {[
                { value: "HADIR", label: "Ya, saya hadir" },
                { value: "TIDAK", label: "Maaf, saya tidak berkenan hadir" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-pink-300 has-checked:border-pink-500 has-checked:bg-pink-50"
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={tamu.rsvp?.status === opt.value}
                    className="accent-pink-600"
                    required
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div>
              <label htmlFor="jumlahHadir" className="label">
                Jumlah orang yang hadir (maks. {tamu.jumlahKursi} kursi)
              </label>
              <input
                id="jumlahHadir"
                name="jumlahHadir"
                type="number"
                min={1}
                max={tamu.jumlahKursi}
                defaultValue={tamu.rsvp?.jumlahHadir ?? 1}
                className="input"
              />
            </div>
            <SubmitButton className="w-full">Kirim Konfirmasi</SubmitButton>
          </ActionForm>
        </section>

        <footer className="mt-10 pb-6 text-center">
          <p className="inv-script text-2xl text-pink-600">Terima kasih</p>
          <p className="mt-1 text-xs text-zinc-400">
            Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
          </p>
          <p className="mt-6 text-[10px] text-zinc-300">
            Undangan digital ini dikelola melalui DekorLamaran
          </p>
        </footer>
      </div>
    </main>
  );
}

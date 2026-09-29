import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DekorLamaran",
    template: "%s | DekorLamaran",
  },
  description:
    "DekorLamaran — sistem manajemen Wedding Organizer: jadwal, vendor, tamu, undangan digital QR, dan rekap kehadiran.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-zinc-900">
        {children}
      </body>
    </html>
  );
}

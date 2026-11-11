import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack butuh root eksplisit agar tidak memindai folder induk
  // (D:\kuliahunpam\KP berisi flutter zip 1.9GB + newapp.zip 428MB).
  // Tanpa ini, setiap kompilasi memicu warning + I/O lambat.
  turbopack: {
    root: __dirname,
  },

  // Jangan tampilkan badge dev yang memicu re-render tambahan.
  devIndicators: false,

  // Kompresi response produksi.
  compress: true,

  // polyfill node:fs bawaan Next untuk server actions.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb", // upload paket multi-foto & file undangan (maks 10MB)
    },
  },

  // Cabut header X-Powered-By (kecil, tapi bersih).
  poweredByHeader: false,
};

export default nextConfig;

"use client";

import { useState } from "react";

export function PaketCarousel({
  images,
  alt,
  height = "h-44",
}: {
  images: { id: number; path: string }[];
  alt: string;
  height?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  if (total === 0) return null;

  if (total === 1) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={images[0].path}
        alt={alt}
        className={`${height} w-full object-cover`}
      />
    );
  }

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <div
      className={`group relative ${height} w-full overflow-hidden`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Foto ${alt}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          prev();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          next();
        }
      }}
    >
      {images.map((img, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={img.id}
          src={img.path}
          alt={`${alt} (foto ${i + 1} dari ${total})`}
          className={`${height} w-full object-cover transition-opacity duration-200 ${
            i === index ? "opacity-100" : "absolute inset-0 opacity-0"
          }`}
        />
      ))}

      <button
        type="button"
        onClick={prev}
        aria-label="Foto sebelumnya"
        className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white focus:ring-2 focus:ring-pink-300 focus:outline-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Foto berikutnya"
        className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white focus:ring-2 focus:ring-pink-300 focus:outline-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ke foto ${i + 1}`}
            aria-current={i === index}
            className={`h-2 w-2 cursor-pointer rounded-full transition ${
              i === index ? "bg-pink-600" : "bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>

      <span className="absolute top-2 right-2 rounded-full bg-zinc-900/60 px-2 py-0.5 text-xs font-medium text-white">
        {index + 1}/{total}
      </span>
    </div>
  );
}

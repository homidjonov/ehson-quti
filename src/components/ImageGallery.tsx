import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { BoxThumbnail } from "../types";

interface Props {
  images: BoxThumbnail[];
}

export function ImageGallery({ images }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="h-48 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-sm">
        Rasm yo'q
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="relative h-56 rounded-2xl overflow-hidden bg-muted">
        <img
          src={images[current].small}
          alt=""
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setLightbox(true)}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightbox(false)}
          >
            <X size={28} />
          </button>
          <img
            src={images[current].big}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

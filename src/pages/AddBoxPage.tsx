import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadImage, createBox } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Camera, X, MapPin, Crosshair } from "lucide-react";
import type { BoxImage } from "../types";
import { LocationPickerMap } from "../components/MapView";

const schema = z.object({
  number: z.coerce.number().int().positive("Raqam kiritish shart"),
  lat: z.coerce.number().min(-90).max(90, "Kenglik noto'g'ri"),
  lng: z.coerce.number().min(-180).max(180, "Uzunlik noto'g'ri"),
});

type FormData = z.infer<typeof schema>;

function parseLatLng(val: string): [number, number] | null {
  const m = val.trim().match(/^(-?\d+(?:[.,]\d+)?)[,;\s]+(-?\d+(?:[.,]\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1].replace(",", "."));
  const lng = parseFloat(m[2].replace(",", "."));
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export default function AddBoxPage() {
  const navigate = useNavigate();
  const resetTimer = useAuthStore((s) => s.resetTimer);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<BoxImage[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mapLocation, setMapLocation] = useState<[number, number] | null>(null);
  const [latlngInput, setLatlngInput] = useState("");
  const [latlngError, setLatlngError] = useState("");
  const [locating, setLocating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // On mount: get current location to center the map
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setMapLocation([lat, lng]);
        setValue("lat", lat);
        setValue("lng", lng);
        setLatlngInput(`${lat}, ${lng}`);
      },
      () => {} // silent fail, map uses Tashkent default
    );
  }, []);

  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Joylashuv aniqlash qo'llab-quvvatlanmaydi");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        applyLocation(lat, lng);
        setLocating(false);
      },
      () => {
        toast.error("Joylashuvni aniqlab bo'lmadi");
        setLocating(false);
      }
    );
  };

  const applyLocation = (lat: number, lng: number) => {
    setMapLocation([lat, lng]);
    setValue("lat", lat);
    setValue("lng", lng);
    setLatlngInput(`${lat}, ${lng}`);
    setLatlngError("");
  };

  const handleMapClick = (lat: number, lng: number) => {
    const rlat = parseFloat(lat.toFixed(7));
    const rlng = parseFloat(lng.toFixed(7));
    applyLocation(rlat, rlng);
  };

  const handleLatlngChange = (val: string) => {
    setLatlngInput(val);
    if (!val.trim()) {
      setLatlngError("");
      return;
    }
    const parsed = parseLatLng(val);
    if (parsed) {
      setValue("lat", parsed[0]);
      setValue("lng", parsed[1]);
      setMapLocation(parsed);
      setLatlngError("");
    } else {
      setLatlngError("Format: 41.299500, 69.240100");
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    resetTimer();
    try {
      const uploaded = await Promise.all(toUpload.map((f) => uploadImage(f)));
      setImages((prev) => [...prev, ...uploaded]);
      setPreviews((prev) => [
        ...prev,
        ...toUpload.map((f) => URL.createObjectURL(f)),
      ]);
    } catch (err: any) {
      toast.error(err?.message ?? "Rasm yuklashda xato");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    resetTimer();
    try {
      await createBox({
        number: data.number,
        location: `${data.lat};${data.lng}`,
        images,
      });
      toast.success("Quti yaratildi");
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      navigate(-1);
    } catch (err: any) {
      toast.error(err?.message ?? "Yaratishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Yangi quti</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Quti raqami</label>
          <input
            {...register("number")}
            type="number"
            inputMode="numeric"
            placeholder="221211"
            className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.number && (
            <p className="text-xs text-destructive">{errors.number.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Joylashuv</label>

          {/* Lat,Lng input + location button */}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={latlngInput}
              onChange={(e) => handleLatlngChange(e.target.value)}
              placeholder="41.299500, 69.240100"
              className="flex-1 h-11 px-3 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={goToCurrentLocation}
              disabled={locating}
              className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center text-primary disabled:opacity-50 shrink-0"
            >
              {locating ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair size={18} />
              )}
            </button>
          </div>

          {/* Map */}
          <div className="h-56 rounded-2xl overflow-hidden border border-border">
            <LocationPickerMap location={mapLocation} onLocationChange={handleMapClick} />
          </div>

          {latlngError && (
            <p className="text-xs text-destructive">{latlngError}</p>
          )}
          {(errors.lat || errors.lng) && !latlngError && (
            <p className="text-xs text-destructive">Koordinatani kiriting</p>
          )}

          {/* Hidden fields for form validation */}
          <input type="hidden" {...register("lat")} />
          <input type="hidden" {...register("lng")} />
        </div>

        {/* Images */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Rasmlar (max 3)
          </label>
          <div className="flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              >
                <Camera size={24} />
                <span className="text-xs">{uploading ? "..." : "Qo'shish"}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {submitting ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
}

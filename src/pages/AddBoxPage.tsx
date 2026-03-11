import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadImage, createBox } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Camera, X, MapPin } from "lucide-react";
import type { BoxImage } from "../types";

const schema = z.object({
  number: z.coerce.number().int().positive("Raqam kiritish shart"),
  lat: z.coerce.number().min(-90).max(90, "Kenglik noto'g'ri"),
  lng: z.coerce.number().min(-180).max(180, "Uzunlik noto'g'ri"),
});

type FormData = z.infer<typeof schema>;

export default function AddBoxPage() {
  const navigate = useNavigate();
  const resetTimer = useAuthStore((s) => s.resetTimer);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<BoxImage[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Joylashuv aniqlash qo'llab-quvvatlanmaydi");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", parseFloat(pos.coords.latitude.toFixed(7)));
        setValue("lng", parseFloat(pos.coords.longitude.toFixed(7)));
        toast.success("Joylashuv aniqlandi");
      },
      () => toast.error("Joylashuvni aniqlab bo'lmadi")
    );
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
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full h-12 rounded-xl border border-dashed border-primary text-primary flex items-center justify-center gap-2 text-sm font-medium hover:bg-primary/5"
          >
            <MapPin size={18} />
            Joriy joylashuvni ishlatish
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                {...register("lat")}
                type="number"
                step="any"
                placeholder="Kenglik (lat)"
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {errors.lat && (
                <p className="text-xs text-destructive mt-1">{errors.lat.message}</p>
              )}
            </div>
            <div>
              <input
                {...register("lng")}
                type="number"
                step="any"
                placeholder="Uzunlik (lng)"
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {errors.lng && (
                <p className="text-xs text-destructive mt-1">{errors.lng.message}</p>
              )}
            </div>
          </div>
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

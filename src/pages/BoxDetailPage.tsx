import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoxes, setBoxEmpty } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { ImageGallery } from "../components/ImageGallery";
import { SingleBoxMap } from "../components/MapView";
import { mapsUrl } from "../lib/utils";
import type { Box } from "../types";
import { ArrowLeft, Navigation, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function BoxDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const resetTimer = useAuthStore((s) => s.resetTimer);
  const queryClient = useQueryClient();
  const [settingEmpty, setSettingEmpty] = useState(false);

  // Use passed state first, then fallback to query
  const passedBox = location.state?.box as Box | undefined;
  const { data: boxes = [] } = useQuery({
    queryKey: ["boxes"],
    queryFn: fetchBoxes,
    enabled: !passedBox,
  });

  const box: Box | undefined = passedBox ?? boxes.find((b) => b.id === id);

  if (!box) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Quti topilmadi</p>
        <button onClick={() => navigate(-1)} className="text-primary underline">
          Orqaga
        </button>
      </div>
    );
  }

  const handleSetEmpty = async () => {
    if (!window.confirm("Qutini bo'shatishni tasdiqlaysizmi?")) return;
    setSettingEmpty(true);
    resetTimer();
    try {
      await setBoxEmpty(box.id);
      toast.success("Quti bo'shatildi");
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      navigate(-1);
    } catch (err: any) {
      toast.error(err?.message ?? "Xato yuz berdi");
    } finally {
      setSettingEmpty(false);
    }
  };

  const routeUrl = mapsUrl(box.location);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Quti #{box.number}</h1>
        <span
          className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
            box.is_empty
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          }`}
        >
          {box.is_empty ? "Bo'sh" : "Band"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Map */}
        <div className="h-48 rounded-2xl overflow-hidden border border-border">
          <SingleBoxMap location={box.location} />
        </div>

        {/* Info */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Raqami</span>
            <span className="font-semibold">#{box.number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Koordinata</span>
            <span className="font-mono text-sm">{box.location[0]}, {box.location[1]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Holati</span>
            <span className="font-semibold">{box.is_empty ? "Bo'sh" : "Band"}</span>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Rasmlar
          </h2>
          <ImageGallery images={box.thumbnails ?? []} />
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-4 py-4 border-t border-border flex gap-3">
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-base font-semibold active:scale-95 transition-transform"
        >
          <Navigation size={20} />
          Yo'nalish
        </a>

        {!box.is_empty && (
          <button
            onClick={handleSetEmpty}
            disabled={settingEmpty}
            className="flex-1 h-14 rounded-2xl bg-muted text-foreground flex items-center justify-center gap-2 text-base font-semibold active:scale-95 transition-transform disabled:opacity-40"
          >
            <PackageOpen size={20} />
            {settingEmpty ? "..." : "Bo'shatildi"}
          </button>
        )}
      </div>
    </div>
  );
}

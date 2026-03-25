import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoxes, setBoxEmpty, removeBox, createBox, uploadImage } from "../api/client";
import { BoxesMap, SingleBoxMap, LocationPickerMap } from "../components/MapView";
import { BottomSheet } from "../components/BottomSheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { Box, BoxImage, BoxThumbnail } from "../types";
import { Package, LogOut, Plus, MapPin, Navigation, Camera, X, List, Map as MapIcon, ChevronLeft, ChevronRight, Crosshair } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { parseLocation, mapsUrl } from "../lib/utils";
import { toast } from "sonner";

type FilterType = "all" | "empty" | "full" | "nearest";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BoxesPage() {
  const lock = useAuthStore((s) => s.lock);
  const resetTimer = useAuthStore((s) => s.resetTimer);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<FilterType>("all");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [settingEmpty, setSettingEmpty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add box form state
  const [addNumber, setAddNumber] = useState("");
  const [addLocation, setAddLocation] = useState<[number, number] | null>(null);
  const [addLatlngInput, setAddLatlngInput] = useState("");
  const [addLatlngError, setAddLatlngError] = useState("");
  const [addImages, setAddImages] = useState<BoxImage[]>([]);
  const [addPreviews, setAddPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyAddLocation = (lat: number, lng: number) => {
    const rlat = parseFloat(lat.toFixed(7));
    const rlng = parseFloat(lng.toFixed(7));
    setAddLocation([rlat, rlng]);
    setAddLatlngInput(`${rlat}, ${rlng}`);
    setAddLatlngError("");
  };

  const parseLatlng = (val: string): [number, number] | null => {
    const m = val.trim().match(/^(-?\d+(?:[.,]\d+)?)[,;\s]+(-?\d+(?:[.,]\d+)?)$/);
    if (!m) return null;
    const lat = parseFloat(m[1].replace(",", "."));
    const lng = parseFloat(m[2].replace(",", "."));
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return [lat, lng];
  };

  const handleLatlngInput = (val: string) => {
    setAddLatlngInput(val);
    if (!val.trim()) { setAddLatlngError(""); return; }
    const parsed = parseLatlng(val);
    if (parsed) {
      setAddLocation(parsed);
      setAddLatlngError("");
    } else {
      setAddLatlngError("Format: 41.299500, 69.240100");
    }
  };

  useEffect(() => {
    if (!showAdd || addLocation) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => applyAddLocation(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }, [showAdd]);

  const { data: boxes = [], isLoading, error } = useQuery({
    queryKey: ["boxes"],
    queryFn: fetchBoxes,
  });

  const handleSelectBox = (box: Box) => {
    resetTimer();
    setSelectedBox(box);
  };

  const handleDeleteBox = async () => {
    if (!selectedBox) return;
    setDeleting(true);
    try {
      await removeBox(selectedBox.id);
      toast.success("Quti o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      setConfirmDelete(false);
      setSelectedBox(null);
    } catch (err: any) {
      toast.error(err?.message ?? "O'chirishda xato");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetEmpty = async () => {
    if (!selectedBox) return;
    setSettingEmpty(true);
    resetTimer();
    try {
      await setBoxEmpty(selectedBox.id);
      toast.success("Quti bo'shatildi");
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      setConfirmEmpty(false);
      setSelectedBox(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Xato yuz berdi");
    } finally {
      setSettingEmpty(false);
    }
  };

  const handleAddFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - addImages.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;
    setUploading(true);
    resetTimer();
    try {
      const uploaded = await Promise.all(toUpload.map((f) => uploadImage(f)));
      setAddImages((prev) => [...prev, ...uploaded.flat()]);
      setAddPreviews((prev) => [...prev, ...toUpload.map((f) => URL.createObjectURL(f))]);
    } catch (err: any) {
      toast.error(err?.message ?? "Rasm yuklashda xato");
    } finally {
      setUploading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Joylashuv aniqlash qo'llab-quvvatlanmaydi");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyAddLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        toast.error("Joylashuvni aniqlab bo'lmadi");
        setLocating(false);
      }
    );
  };

  const handleAddSubmit = async () => {
    if (!addNumber.trim()) { toast.error("Quti raqamini kiriting"); return; }
    if (!addLocation) { toast.error("Joylashuvni tanlang"); return; }
    setSubmitting(true);
    resetTimer();
    try {
      await createBox({
        number: parseInt(addNumber),
        location: `${addLocation[0]};${addLocation[1]}`,
        images: addImages,
      });
      toast.success("Quti yaratildi");
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      closeAddSheet();
    } catch (err: any) {
      toast.error(err?.message ?? "Yaratishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAddSheet = () => {
    setShowAdd(false);
    setAddNumber("");
    setAddLocation(null);
    setAddLatlngInput("");
    setAddLatlngError("");
    setAddImages([]);
    setAddPreviews([]);
  };

  const filteredBoxes = useMemo(() => {
    if (filter === "empty") return boxes.filter((b) => b.is_empty);
    if (filter === "full") return boxes.filter((b) => !b.is_empty);
    if (filter === "nearest" && userLocation) {
      return [...boxes].sort((a, b) => {
        const locA = parseLocation(a.location);
        const locB = parseLocation(b.location);
        if (!locA && !locB) return 0;
        if (!locA) return 1;
        if (!locB) return -1;
        const distA = getDistance(userLocation[0], userLocation[1], locA[0], locA[1]);
        const distB = getDistance(userLocation[0], userLocation[1], locB[0], locB[1]);
        return distA - distB;
      });
    }
    return boxes;
  }, [boxes, filter, userLocation]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    if (f === "nearest" && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => toast.error("Joylashuvni aniqlab bo'lmadi")
      );
    }
  };

  const allCoords = boxes.map((b) => parseLocation(b.location)).filter(Boolean) as [number, number][];
  const mapCenter: [number, number] | undefined = allCoords.length
    ? [
        allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
        allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
      ]
    : undefined;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}>
        <h1 className="text-xl font-bold text-foreground">Exson qutilar</h1>
        <button onClick={lock} className="p-2 text-destructive active:scale-95 transition-transform">
          <LogOut size={22} />
        </button>
      </div>

      {/* Filter */}
      {tab === "list" && !isLoading && !error && boxes.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto flex-shrink-0">
          {([
            ["all", "Barcha"],
            ["empty", "Bo'sh"],
            ["full", "To'la"],
            ["nearest", "Yaqin"],
          ] as [FilterType, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm">
            Yuklashda xato yuz berdi
          </div>
        )}
        {!isLoading && !error && tab === "list" && (
          <div className="h-full overflow-y-auto px-4 py-2 space-y-3">
            {boxes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Package size={48} strokeWidth={1} />
                <p>Qutilar yo'q</p>
              </div>
            )}
            {filteredBoxes.length === 0 && boxes.length > 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Package size={48} strokeWidth={1} />
                <p>Natija topilmadi</p>
              </div>
            )}
            {filteredBoxes.map((box) => (
              <BoxCard key={box.id} box={box} onClick={() => handleSelectBox(box)} />
            ))}
          </div>
        )}
        {!isLoading && !error && tab === "map" && (
          <div className="h-full relative">
            <BoxesMap boxes={boxes} onSelect={handleSelectBox} userLocation={userLocation} fallbackCenter={mapCenter} />
            <button
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                  () => toast.error("Joylashuvni aniqlab bo'lmadi")
                );
              }}
              className="absolute bottom-5 right-4 w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-border shadow-lg flex items-center justify-center text-primary"
              style={{ zIndex: 1000 }}
            >
              <Crosshair size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex border-t border-border bg-white flex-shrink-0">
        <button
          onClick={() => setTab("list")}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
            tab === "list" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <List size={22} />
          Qutilar
        </button>
        <button
          onClick={() => {
            setTab("map");
            navigator.geolocation?.getCurrentPosition(
              (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
              () => {}
            );
          }}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
            tab === "map" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MapIcon size={22} />
          Xarita
        </button>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus size={26} />
      </button>

      {/* Box Detail Bottom Sheet */}
      <BottomSheet open={!!selectedBox} onClose={() => setSelectedBox(null)}>
        {selectedBox && (
          <BoxDetailContent
            box={selectedBox}
            onClose={() => setSelectedBox(null)}
            onSetEmpty={() => setConfirmEmpty(true)}
            onLongPressIcon={() => setConfirmDelete(true)}
          />
        )}
      </BottomSheet>

      {/* Add Box Bottom Sheet */}
      <BottomSheet open={showAdd} onClose={closeAddSheet}>
        <div className="px-5 pb-8">
          {/* Sheet Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Yangi exson quti qo'shish</h2>
            <button onClick={closeAddSheet} className="p-1.5 rounded-full hover:bg-muted">
              <X size={20} />
            </button>
          </div>

          {/* Number input */}
          <input
            type="number"
            value={addNumber}
            onChange={(e) => setAddNumber(e.target.value)}
            placeholder="Exson quti raqami"
            className="w-full h-12 px-4 rounded-2xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          />

          {/* Lat,Lng input + crosshair button */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={addLatlngInput}
              onChange={(e) => handleLatlngInput(e.target.value)}
              placeholder="41.299500, 69.240100"
              className="flex-1 h-11 px-3 rounded-2xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="w-11 h-11 rounded-2xl border border-border bg-muted flex items-center justify-center text-primary disabled:opacity-50 shrink-0"
            >
              {locating ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair size={18} />
              )}
            </button>
          </div>
          {addLatlngError && (
            <p className="text-xs text-destructive mb-2">{addLatlngError}</p>
          )}

          {/* Map picker */}
          <div className="h-52 rounded-2xl overflow-hidden border border-border mb-4">
            <LocationPickerMap
              location={addLocation}
              onLocationChange={(lat, lng) => applyAddLocation(lat, lng)}
            />
          </div>

          {/* Images */}
          <div className="flex gap-3 flex-wrap mb-5">
            {addPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setAddImages((p) => p.filter((_, idx) => idx !== i));
                    setAddPreviews((p) => p.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {addImages.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              >
                <Camera size={22} />
                <span className="text-xs">{uploading ? "..." : "Rasm yuklash"}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={closeAddSheet}
              className="flex-1 h-14 rounded-2xl border border-border text-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={submitting || uploading || !addNumber.trim() || addImages.length === 0 || !addLocation}
              className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
            >
              {submitting ? "Saqlanmoqda..." : "Quti qo'shish"}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Confirm Empty Dialog */}
      <ConfirmDialog
        open={confirmEmpty}
        title="Bo'shatishni tasdiqlang"
        description="Ushbu amal qutini bo'sh sifatida belgilaydi. Davom etishni xohlaysizmi?"
        onConfirm={handleSetEmpty}
        onCancel={() => setConfirmEmpty(false)}
        loading={settingEmpty}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Qutini o'chirasizmi?"
        description="Bu amalni ortga qaytarib bo'lmaydi. Quti butunlay o'chiriladi."
        confirmLabel="O'chirish"
        onConfirm={handleDeleteBox}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </div>
  );
}

function BoxCard({ box, onClick }: { box: Box; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-border text-left active:scale-[0.98] transition-all shadow-sm"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Package size={22} className="text-primary" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">Exson qutisi {box.number}</p>
        <p className="text-sm text-muted-foreground">{new Date(box.created_at * 1000).toLocaleDateString("ru-RU")}</p>
      </div>
      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${
        box.is_empty
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary"
      }`}>
        {box.is_empty ? "Bo'sh" : "To'la"}
      </span>
    </button>
  );
}

function BoxDetailContent({ box, onClose, onSetEmpty, onLongPressIcon }: {
  box: Box;
  onClose: () => void;
  onSetEmpty: () => void;
  onLongPressIcon: () => void;
}) {
  const routeUrl = mapsUrl(box.location);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLongPress = () => {
    setHoldProgress(0);
    const start = Date.now();
    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setHoldProgress(Math.min(elapsed / 5000, 1));
    }, 50);
    longPressTimer.current = setTimeout(() => {
      clearInterval(holdInterval.current!);
      setHoldProgress(0);
      onLongPressIcon();
    }, 5000);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
    longPressTimer.current = null;
    holdInterval.current = null;
    setHoldProgress(0);
  };

  const RADIUS = 20;
  const CIRC = 2 * Math.PI * RADIUS;

  return (
    <div className="px-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 24px) + 2rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative select-none"
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={(e) => { e.preventDefault(); startLongPress(); }}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Package size={22} className="text-primary" strokeWidth={1.8} />
          {holdProgress > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - holdProgress)}
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Exson qutisi {box.number}</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block mt-0.5 ${
            box.is_empty ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}>
            {box.is_empty ? "Bo'sh" : "To'la"}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* Location */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
          <MapPin size={14} />
          <span>Joylashuv</span>
        </div>
        <p className="font-mono text-sm text-foreground">{box.location[0]}, {box.location[1]}</p>
      </div>

      {/* Map */}
      <div className="h-44 rounded-2xl overflow-hidden border border-border mb-4">
        <SingleBoxMap location={box.location} />
      </div>

      {/* Images */}
      {box.thumbnails?.length > 0 && (
        <ImageGrid thumbnails={box.thumbnails} />
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!box.is_empty && (
          <button
            onClick={onSetEmpty}
            className="flex-1 h-14 rounded-2xl bg-muted text-foreground flex items-center justify-center font-semibold text-sm active:scale-95 transition-transform"
          >
            Bo'shatish
          </button>
        )}
        <a
          href={routeUrl}
          onClick={(e) => { e.preventDefault(); window.location.href = routeUrl; }}
          className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 font-semibold text-sm active:scale-95 transition-transform"
        >
          <Navigation size={18} />
          Yo'nalish
        </a>
      </div>
    </div>
  );
}

function ImageGrid({ thumbnails }: { thumbnails: BoxThumbnail[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-2">Rasmlar</p>
        <div className="grid grid-cols-3 gap-2">
          {thumbnails.map((thumb, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-transform"
            >
              <img src={thumb.small} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          thumbnails={thumbnails}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({ thumbnails, index, onChange, onClose }: {
  thumbnails: BoxThumbnail[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const touchStartX = useRef<number | null>(null);

  const prev = () => onChange((index - 1 + thumbnails.length) % thumbnails.length);
  const next = () => onChange((index + 1) % thumbnails.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="absolute inset-0 bg-black flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 text-white bg-white/20 rounded-full p-2"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={24} />
      </button>

      <img
        src={thumbnails[index].big}
        alt=""
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {thumbnails.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/20 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/20 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight size={28} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {thumbnails.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(i); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

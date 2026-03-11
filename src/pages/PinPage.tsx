import { useState, useEffect, useCallback } from "react";
import { verifyPin } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { Lock, X as XIcon, Delete } from "lucide-react";

const PIN_LENGTH = 6;

export default function PinPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleKey = (val: string) => {
    if (!loading && pin.length < PIN_LENGTH) setPin((p) => p + val);
  };

  const handleClearAll = () => {
    if (!loading) setPin("");
  };

  const handleDeleteLast = () => {
    if (!loading) setPin((p) => p.slice(0, -1));
  };

  const handleSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH || loading) return;
    setLoading(true);
    try {
      const res = await verifyPin(pin);
      login(res.hash);
    } catch (err: any) {
      toast.error(err?.message ?? "Noto'g'ri PIN kod");
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [pin, loading, login]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleSubmit();
  }, [pin.length]); // eslint-disable-line

  const keys = ["1","2","3","4","5","6","7","8","9","tozalash","0","del"];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-7 px-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
        <Lock size={36} className="text-primary" strokeWidth={1.8} />
      </div>

      {/* Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold text-foreground">PIN kiriting</h1>
        <p className="text-sm text-muted-foreground">Davom etish uchun 6 raqamli PIN kiriting</p>
      </div>

      {/* Dots */}
      <div className="flex gap-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? "bg-primary border-primary scale-110"
                : "border-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {keys.map((k, i) => {
          if (k === "tozalash")
            return (
              <button
                key="tozalash"
                onClick={handleClearAll}
                disabled={pin.length === 0 || loading}
                className="h-16 rounded-2xl bg-white shadow-sm border border-border text-muted-foreground flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
              >
                <XIcon size={20} />
              </button>
            );
          if (k === "del")
            return (
              <button
                key="del"
                onClick={handleDeleteLast}
                disabled={pin.length === 0 || loading}
                className="h-16 rounded-2xl bg-white shadow-sm border border-border text-muted-foreground flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
              >
                <Delete size={20} />
              </button>
            );
          return (
            <button
              key={i}
              onClick={() => handleKey(k)}
              disabled={loading}
              className="h-16 rounded-2xl bg-white shadow-sm border border-border text-xl font-semibold text-foreground active:scale-95 transition-transform hover:bg-muted/50"
            >
              {k}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

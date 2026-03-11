interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Ha, bo'shatish", onConfirm, onCancel, loading }: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6" style={{ zIndex: 3000 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl border border-border text-foreground font-semibold text-sm active:scale-95 transition-transform"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, loading]);

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onCancel}>
      <div
        className="modal-panel confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={danger ? "demote-button" : "promote-button"}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Working..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useState } from "react";

import { ToastContext } from "./toastContextObject";

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = {
    showToast,
    success: (message, duration) => showToast(message, "success", duration),
    error: (message, duration) => showToast(message, "error", duration),
    info: (message, duration) => showToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

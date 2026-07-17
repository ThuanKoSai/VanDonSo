import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // type: "success" | "error" | "info"
  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = ++idCounter;
    setToasts((list) => [...list, { id, message, type }]);
    if (duration) {
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      {/* Vùng hiển thị toast — cố định góc dưới-phải, không cản luồng đọc chính */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm"
        role="region"
        aria-live="polite"
        aria-label="Thông báo"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={
              "flex items-start gap-2.5 px-4 py-3 border shadow-none text-sm bg-paper " +
              (t.type === "success"
                ? "border-forest text-forest"
                : t.type === "error"
                ? "border-crimson text-crimson"
                : "border-rule text-ink")
            }
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 mt-0.5">
              {t.type === "success" && <path d="M5 13l4 4L19 7" />}
              {t.type === "error" && (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </>
              )}
              {t.type === "info" && (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8h.01M12 12v4" />
                </>
              )}
            </svg>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 text-inksoft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() phải được gọi bên trong <ToastProvider>");
  return ctx;
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext(null);

const DEFAULT_DURATION = 5000;

const TONES = {
  error: {
    Icon: FiAlertCircle,
    accent: "text-rose-600",
    ring: "border-rose-200",
    // Errors persist until dismissed: they usually need the user to do something.
    sticky: true,
  },
  info: { Icon: FiInfo, accent: "text-slate-500", ring: "border-slate-200", sticky: false },
  success: { Icon: FiCheckCircle, accent: "text-emerald-600", ring: "border-emerald-200", sticky: false },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ description = "", duration, title, type = "info" }) => {
      const tone = TONES[type] || TONES.info;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((current) => [...current.slice(-3), { description, id, title, type }]);

      const life = duration ?? (tone.sticky ? 0 : DEFAULT_DURATION);
      if (life > 0) {
        timers.current.set(id, window.setTimeout(() => dismiss(id), life));
      }

      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      dismiss,
      error: (title, description) => notify({ description, title, type: "error" }),
      info: (title, description) => notify({ description, title, type: "info" }),
      notify,
      success: (title, description) => notify({ description, title, type: "success" }),
    }),
    [dismiss, notify],
  );

  const timersRef = timers;
  useEffect(() => () => timersRef.current.forEach((timer) => window.clearTimeout(timer)), [timersRef]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/*
        Screen readers announce these because the region is live. `polite` waits for a
        pause so it never interrupts what the user is doing.
      */}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((item) => {
          const tone = TONES[item.type] || TONES.info;
          const Icon = tone.Icon;

          return (
            <div
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg shadow-slate-900/10 ${tone.ring} animate-fade-in`}
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
            >
              <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${tone.accent}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                )}
              </div>
              <button
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => dismiss(item.id)}
                type="button"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/** Safe to call anywhere; returns a no-op shim if the provider is absent. */
export const useToast = () => useContext(ToastContext) || {
  dismiss: () => {},
  error: () => {},
  info: () => {},
  notify: () => {},
  success: () => {},
};

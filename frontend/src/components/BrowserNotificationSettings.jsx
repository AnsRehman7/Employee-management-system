import { useEffect, useState } from "react";
import { FiBell, FiCheckCircle } from "react-icons/fi";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "../utils/browserNotifications";
import { registerPushDevice } from "../utils/pushNotifications";

const permissionCopy = {
  default: {
    description: "Native alerts are ready to be enabled for this browser.",
    label: "Not enabled",
    style: "border-amber-200 bg-amber-50 text-amber-700",
  },
  denied: {
    description: "Notifications are blocked. Allow them in this site's browser permissions, then return here.",
    label: "Blocked",
    style: "border-rose-200 bg-rose-50 text-rose-700",
  },
  granted: {
    description: "Task assignments and workspace updates can appear in Windows notifications.",
    label: "Enabled",
    style: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  unsupported: {
    description: "This browser does not support native web notifications.",
    label: "Unavailable",
    style: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const BrowserNotificationSettings = () => {
  const [permission, setPermission] = useState(getBrowserNotificationPermission);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const state = permissionCopy[permission] || permissionCopy.unsupported;

  useEffect(() => {
    const syncPermission = (event) => setPermission(event.detail || getBrowserNotificationPermission());
    window.addEventListener("staffflow:notification-permission", syncPermission);
    window.addEventListener("focus", syncPermission);
    return () => {
      window.removeEventListener("staffflow:notification-permission", syncPermission);
      window.removeEventListener("focus", syncPermission);
    };
  }, []);

  useEffect(() => {
    if (permission === "granted") registerPushDevice().catch(() => {});
  }, [permission]);

  const enableNotifications = async () => {
    setBusy("enable");
    setMessage("");
    try {
      const nextPermission = await requestBrowserNotificationPermission();
      setPermission(nextPermission);
      if (nextPermission === "granted") {
        const result = await registerPushDevice();
        setMessage(result.registered ? "Real-time desktop notifications are enabled." : "Desktop notifications are enabled on this device.");
      }
    } catch {
      setMessage("The browser could not update notification permissions.");
    } finally {
      setBusy("");
    }
  };

  const sendTestNotification = async () => {
    setBusy("test");
    setMessage("");
    try {
      await showBrowserNotification({
        actionUrl: "/settings#notifications",
        id: `staffflow-test-${Date.now()}`,
        message: "Native StaffFlow alerts are working on this device.",
        title: "StaffFlow notification test",
      });
      setMessage("Test notification sent.");
    } catch {
      setMessage("Windows did not accept the test notification.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" id="notifications">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
          <FiBell className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">Desktop notifications</h2>
          <p className="text-sm text-slate-500">Native alerts for assignments, completions, and project activity.</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${state.style}`}>
            {state.label}
          </span>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{state.description}</p>
          {message && <p aria-live="polite" className="mt-2 text-xs font-bold text-slate-600">{message}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {permission === "default" && (
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60" disabled={Boolean(busy)} onClick={enableNotifications} type="button">
              <FiBell className="h-4 w-4" />
              {busy === "enable" ? "Enabling..." : "Enable alerts"}
            </button>
          )}
          {permission === "granted" && (
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" disabled={Boolean(busy)} onClick={sendTestNotification} type="button">
              <FiCheckCircle className="h-4 w-4" />
              {busy === "test" ? "Sending..." : "Send test"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrowserNotificationSettings;

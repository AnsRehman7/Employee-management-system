import { useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api } from "../context/api";

const formatRelativeTime = (value) => {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const knownIds = useRef(new Set());
  const initialized = useRef(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [desktopPermission, setDesktopPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "unsupported",
  );

  const loadNotifications = async () => {
    try {
      const result = await api.getNotifications();
      const incoming = result.notifications || [];

      if (initialized.current && desktopPermission === "granted") {
        incoming
          .filter((notification) => !notification.isRead && !knownIds.current.has(notification.id))
          .forEach((notification) => {
            const desktopNotification = new window.Notification(notification.title, {
              body: notification.message,
              icon: "/employee.png",
              tag: notification.id,
            });
            desktopNotification.onclick = () => {
              window.focus();
              if (notification.actionUrl) navigate(notification.actionUrl);
              desktopNotification.close();
            };
          });
      }

      knownIds.current = new Set(incoming.map(({ id }) => id));
      initialized.current = true;
      setError("");
      setNotifications(incoming);
      setUnreadCount(result.unreadCount || 0);
    } catch {
      setError("Notifications are temporarily unavailable.");
    }
  };

  useEffect(() => {
    loadNotifications();
    const poller = window.setInterval(loadNotifications, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(poller);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
    // Permission changes are intentionally picked up by the next polling cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopPermission]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const enableDesktopNotifications = async () => {
    if (!("Notification" in window)) return;
    try {
      const permission = await window.Notification.requestPermission();
      setDesktopPermission(permission);
    } catch {
      setError("Your browser could not enable desktop notifications.");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await api.markNotificationRead(notification.id).catch(() => {});
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    setOpen(false);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      setError("");
    } catch {
      setError("Could not mark notifications as read.");
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-violet-50 hover:text-violet-700" onClick={() => setOpen((current) => !current)} title="Notifications" type="button">
        <FiBell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div><h2 className="text-sm font-bold text-slate-950">Notifications</h2><p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread</p></div>
            {unreadCount > 0 && <button className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800" onClick={markAllRead} type="button"><FiCheck className="h-3.5 w-3.5" />Mark all read</button>}
          </div>

          {desktopPermission === "default" && (
            <button className="flex w-full items-center gap-3 border-b border-violet-100 bg-violet-50 px-4 py-3 text-left transition hover:bg-violet-100" onClick={enableDesktopNotifications} type="button"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 ring-1 ring-violet-200"><FiBell className="h-4 w-4" /></span><span><span className="block text-xs font-bold text-violet-900">Enable desktop alerts</span><span className="mt-0.5 block text-xs text-violet-700">Show new StaffFlow activity in Windows.</span></span></button>
          )}

          {error && <p aria-live="polite" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">{error}</p>}

          <div className="max-h-[430px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center"><FiCheckCircle className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-bold text-slate-700">You are all caught up</p><p className="mt-1 text-xs text-slate-500">New assignments and workspace updates will appear here.</p></div>
            ) : (
              notifications.map((notification) => (
                <button className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${notification.isRead ? "bg-white" : "bg-violet-50/50"}`} key={notification.id} onClick={() => openNotification(notification)} type="button">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200" : "bg-violet-600"}`} />
                  <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="text-sm font-bold text-slate-900">{notification.title}</span><span className="shrink-0 text-[11px] font-semibold text-slate-400">{formatRelativeTime(notification.createdAt)}</span></span><span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span></span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

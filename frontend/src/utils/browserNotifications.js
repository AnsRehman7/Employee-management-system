const SERVICE_WORKER_PATH = "/staffflow-notifications-sw.js";

let registrationPromise;

export const getBrowserNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
};

export const registerNotificationWorker = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SERVICE_WORKER_PATH, { scope: "/" })
      .then(() => navigator.serviceWorker.ready);
  }
  return registrationPromise;
};

export const requestBrowserNotificationPermission = async () => {
  if (getBrowserNotificationPermission() === "unsupported") return "unsupported";
  const permission = await window.Notification.requestPermission();
  if (permission === "granted") await registerNotificationWorker();
  window.dispatchEvent(new CustomEvent("staffflow:notification-permission", { detail: permission }));
  return permission;
};

export const showBrowserNotification = async (notification) => {
  if (getBrowserNotificationPermission() !== "granted") return false;

  const options = {
    badge: "/employee.png",
    body: notification.message,
    data: {
      actionUrl: notification.actionUrl || "/",
    },
    icon: "/employee.png",
    renotify: false,
    tag: notification.id,
  };

  const registration = await registerNotificationWorker().catch(() => null);
  if (registration?.showNotification) {
    await registration.showNotification(notification.title, options);
    return true;
  }

  const desktopNotification = new window.Notification(notification.title, options);
  desktopNotification.onclick = () => {
    window.focus();
    if (notification.actionUrl) window.location.assign(notification.actionUrl);
    desktopNotification.close();
  };
  return true;
};

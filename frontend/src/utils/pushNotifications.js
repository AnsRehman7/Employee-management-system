import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { api } from "../context/api";
import { firebaseapp } from "../context/firebase";
import { registerNotificationWorker } from "./browserNotifications";

const TOKEN_STORAGE_KEY = "staffflow.push.token";
let foregroundUnsubscribe;
let bridgeStarted = false;

export const registerPushDevice = async () => {
  const supported = await isSupported().catch(() => false);
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!supported) return { reason: "unsupported", registered: false };
  if (!vapidKey) return { reason: "not_configured", registered: false };
  if (window.Notification?.permission !== "granted") return { reason: "permission_required", registered: false };

  const serviceWorkerRegistration = await registerNotificationWorker();
  const token = await getToken(getMessaging(firebaseapp), { serviceWorkerRegistration, vapidKey });
  if (!token) return { reason: "token_unavailable", registered: false };

  await api.registerPushSubscription({
    deviceName: `${navigator.platform || "Web"} / ${navigator.userAgentData?.brands?.[0]?.brand || "Browser"}`,
    platform: "web",
    token,
  });
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return { registered: true, token };
};

export const unregisterPushDevice = async () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;
  await api.unregisterPushSubscription(token).catch(() => {});
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const startPushBridge = async () => {
  if (bridgeStarted) return foregroundUnsubscribe || (() => {});
  bridgeStarted = true;

  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "STAFFFLOW_BACKGROUND_PUSH") {
      window.dispatchEvent(new CustomEvent("staffflow:background-push", { detail: event.data.payload }));
    }
  });

  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};
  foregroundUnsubscribe = onMessage(getMessaging(firebaseapp), (payload) => {
    window.dispatchEvent(new CustomEvent("staffflow:foreground-push", { detail: payload }));
  });
  return foregroundUnsubscribe;
};

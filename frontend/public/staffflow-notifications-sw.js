self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() || {};
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "StaffFlow";
  const actionUrl = data.actionUrl || "/";

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        badge: "/employee.png",
        body: notification.body || data.message || "You have a new workspace update.",
        data: { actionUrl },
        icon: "/employee.png",
        tag: data.eventId || `${data.entityType || "activity"}-${data.entityId || Date.now()}-${data.type || "update"}`,
      }),
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((windows) =>
        Promise.all(windows.map((client) => client.postMessage({ payload, type: "STAFFFLOW_BACKGROUND_PUSH" }))),
      ),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = new URL(event.notification.data?.actionUrl || "/", self.location.origin);
  const actionUrl =
    requestedUrl.origin === self.location.origin ? requestedUrl.href : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then(async (windows) => {
      const sameOriginWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (sameOriginWindow) {
        await sameOriginWindow.navigate(actionUrl);
        return sameOriginWindow.focus();
      }
      return self.clients.openWindow(actionUrl);
    }),
  );
});

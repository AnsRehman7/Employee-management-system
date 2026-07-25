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

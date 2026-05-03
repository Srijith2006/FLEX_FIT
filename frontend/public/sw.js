self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "FlexFit", {
      body:  data.body  || "You have a new notification",
      icon:  data.icon  || "/icon.png",
      badge: "/icon.png",
      data:  data.data  || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
        clientList[0].postMessage({ type: "notification_click", data: event.notification.data });
      } else {
        clients.openWindow("/dashboard");
      }
    })
  );
});

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
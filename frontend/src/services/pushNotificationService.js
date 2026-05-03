const VAPID_PUBLIC_KEY_FALLBACK = ""; // filled from API

async function getVapidKey() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}/api/vapid-public-key`);
    const data = await res.json();
    return data.key;
  } catch { return null; }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export async function registerPushNotifications(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const vapidKey = await getVapidKey();
    if (!vapidKey) return false;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Save subscription to backend
    await fetch(`${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(subscription),
    });

    return true;
  } catch (err) {
    console.warn("Push registration failed:", err);
    return false;
  }
}

// Show a local notification (when tab is active)
export function showLocalNotification(title, body, onClick) {
  if (Notification.permission === "granted") {
    const n = new Notification(title, { body, icon: "/icon.png" });
    if (onClick) n.onclick = onClick;
  }
}
/**
 * Notification Service Engine
 * Provides a unified wrapper for the HTML5 Notification API, automatically bridging
 * to native OS notifications when running within Electron, and falling back safely
 * in unsupported environments.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications are not supported in this environment.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico", // default fallback icon
      ...options,
    });
  }
}

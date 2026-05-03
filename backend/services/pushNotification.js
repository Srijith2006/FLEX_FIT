import webpush from "web-push";
import { User } from "../models/index.js";

const configured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;

if (configured) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "admin@flexfit.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const sendPushToUser = async (userId, title, body, data = {}) => {
  if (!configured) return;
  try {
    const user = await User.findById(userId).select("pushSubscription");
    if (!user?.pushSubscription) return;

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({ title, body, icon: "/icon.png", data })
    );
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null });
    }
  }
};

export const savePushSubscription = async (userId, subscription) => {
  await User.findByIdAndUpdate(userId, { pushSubscription: subscription });
};

export const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;
import * as admin from "firebase-admin";

const isConfigured = 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_PRIVATE_KEY !== "your_private_key";

if (!admin.apps.length && isConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

// Exporting proxies to prevent crashes if not initialized
export const adminDb = isConfigured ? admin.firestore() : null as any;
export const adminAuth = isConfigured ? admin.auth() : null as any;

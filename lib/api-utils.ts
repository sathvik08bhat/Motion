import { NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

/**
 * Verifies the Firebase ID Token from the Authorization header.
 * Returns the userId (uid) if successful, otherwise null.
 */
export async function verifyUser(req: Request) {
  if (!adminAuth) {
    console.warn("Server is not configured for Auth.");
    return null;
  }
  
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

/**
 * Standardized unauthorized response.
 */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Standardized error response.
 */
export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

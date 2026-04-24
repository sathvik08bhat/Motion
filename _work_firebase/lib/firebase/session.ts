import { getFirebaseAuth } from "./client";

export function getUidOrThrow(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not authenticated yet.");
  return uid;
}


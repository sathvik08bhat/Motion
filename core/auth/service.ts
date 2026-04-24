import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase/client";

export function subscribeToAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

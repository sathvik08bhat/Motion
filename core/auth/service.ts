import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) return { user: null, error: "Firebase is not configured. Please add your credentials to .env.local" };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function logout() {
  if (!auth) return { error: "Firebase is not configured." };
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

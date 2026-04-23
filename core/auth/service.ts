import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const googleProvider = new GoogleAuthProvider();

/**
 * Signs in the user using Google OAuth.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    return { user: null, error: error.message };
  }
}

/**
 * Signs out the current user.
 */
export async function logout() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error("Logout Error:", error);
    return { error: error.message };
  }
}

/**
 * Listens for auth state changes.
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

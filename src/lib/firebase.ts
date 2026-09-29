import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Use the specific firestoreDatabaseId from config if provided
export const db = firebaseConfigData.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Check if invite-only access is restricted by environment
export const checkEmailAllowed = (email: string | null): boolean => {
  const allowedEmailsEnv = import.meta.env.VITE_ALLOWED_EMAILS;
  if (!allowedEmailsEnv || typeof allowedEmailsEnv !== 'string' || allowedEmailsEnv.trim() === '') {
    // No restriction set, all authenticated users allowed
    return true;
  }
  if (!email) return false;
  const list = allowedEmailsEnv.split(',').map((e: string) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    if (!checkEmailAllowed(result.user.email)) {
      await fbSignOut(auth);
      throw new Error(`Access restricted: ${result.user.email} is not on the invited access list.`);
    }
  }
  return result.user;
};

export const logOut = async () => {
  await fbSignOut(auth);
};

export { onAuthStateChanged, type User };

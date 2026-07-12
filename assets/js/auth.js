// auth.js — authentication logic only (no DOM). UI lives in app.js.
import { auth } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-init.js";

// Subscribe to auth state changes. Returns the unsubscribe fn.
export function watchUser(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Persist a minimal profile so we have the email + creation date on record.
  await setDoc(
    doc(db, "users", cred.user.uid),
    { email: cred.user.email, createdAt: serverTimestamp() },
    { merge: true }
  );
  return cred.user;
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return fbSignOut(auth);
}

export function currentUser() {
  return auth.currentUser;
}

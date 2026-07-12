// firebase-init.js — initialize the LUMIÈRE Firebase app (client-side web config).
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web config provided for the eye-wear-726ac project. This is a public client
// key (safe to ship in browser code); access is locked down by Firestore rules.
const firebaseConfig = {
  apiKey: "AIzaSyCO0HgMSpCdHPUXsxBApWivzXQKk3rPEVA",
  authDomain: "eye-wear-726ac.firebaseapp.com",
  projectId: "eye-wear-726ac",
  storageBucket: "eye-wear-726ac.firebasestorage.app",
  messagingSenderId: "888536155218",
  appId: "1:888536155218:web:34135b9923c84ccf7c8b8b",
  measurementId: "G-EFX467ZKNK",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// browserLocalPersistence keeps the session in localStorage so users stay
// signed in across browser restarts / tab closes — like any normal website.
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("[LUMIÈRE] auth persistence warning:", e)
);

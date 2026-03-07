import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAAITZFwE5bOgvsNsJgWVVhMoFn-PdM8Yw",
  authDomain: "sheet-sync-ffa54.firebaseapp.com",
  projectId: "sheet-sync-ffa54",
  storageBucket: "sheet-sync-ffa54.firebasestorage.app",
  messagingSenderId: "474535878410",
  appId: "1:474535878410:web:ce4bba065efc5113e064f3",
  measurementId: "G-1EEMR14W5P"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
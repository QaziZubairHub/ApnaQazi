import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCz8z_Vv61x0hI4LwqWC7vlEMvWluppzOQ",
  authDomain: "apnaqazi-1a4dd.firebaseapp.com",
  projectId: "apnaqazi-1a4dd",
  storageBucket: "apnaqazi-1a4dd.firebasestorage.app",
  messagingSenderId: "130394068798",
  appId: "1:130394068798:web:fa3b8a6b2cf2285911be6f",
  measurementId: "G-Z8WV1E33TH"
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
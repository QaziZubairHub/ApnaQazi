import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ── Role Logic (deterministic, no overwrites) ─────────────────────────
// Goal: never override a role that already exists in Firestore.
// 1) If user's doc exists and has role → use it.
// 2) If user's doc exists but role is missing → only assign admin if NO admin exists.
// 3) If user's doc doesn't exist → only create admin if NO admin exists.
const getOrCreateRole = async (uid, email) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));

    // If user doc exists and role is already set, ALWAYS trust it.
    if (snap.exists()) {
      const data = snap.data();
      if (data?.role) return data.role;

      // Role missing: only assign admin if system has no admin.
      const adminsSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      const hasAnyAdmin = !adminsSnap.empty;
      if (!hasAnyAdmin) {
        // Assign only once (admin takeover) when absolutely needed.
        await updateDoc(doc(db, "users", uid), { role: "admin" });
        return "admin";
      }

      return "user";
    }

    // User doc doesn't exist yet
    const adminsSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "admin"))
    );
    const hasAnyAdmin = !adminsSnap.empty;

    if (!hasAnyAdmin) {
      await setDoc(doc(db, "users", uid), {
        role: "admin",
        email: email || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return "admin";
    }

    return "user";
  } catch {
    return "user";
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const ADMIN_EMAIL = "qazizubairleo@gmail.com";

  useEffect(() => {
    let unsubDoc = () => {};

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubDoc();
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const assignedRole = await getOrCreateRole(firebaseUser.uid, firebaseUser.email);
          setRole(assignedRole);

          const userRef = doc(db, "users", firebaseUser.uid);
          unsubDoc = onSnapshot(userRef, (snap) => {
            if (snap.exists()) setUserData(snap.data());
            else setUserData(null);
          }, () => setUserData(null));
        } catch {
          setRole("user");
        }
      } else {
        setUserData(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => {
      unsub();
      unsubDoc();
    };
  }, []);

  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
  };

  const isAdmin = !!(user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  return (
    <AuthContext.Provider value={{ user, userData, role, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

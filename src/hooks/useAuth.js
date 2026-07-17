import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            setUserRole(null);
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isSuperAdmin = userRole === 'super_admin';

  return { user, userRole, isSuperAdmin, loading };
};

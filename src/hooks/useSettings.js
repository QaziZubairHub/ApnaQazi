import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useSettings = (section) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'settings', section);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data());
        } else {
          setData({});
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [section]);

  const updateSettings = async (newData) => {
    try {
      const docRef = doc(db, 'settings', section);
      await updateDoc(docRef, newData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { data, loading, error, updateSettings };
};

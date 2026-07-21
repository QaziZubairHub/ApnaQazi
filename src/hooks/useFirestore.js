import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestore = (collectionName, queryConstraints = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...queryConstraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(queryConstraints)]);

  const add = async (data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      return { success: true, id: docRef.id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const update = async (id, data) => {
    try {
      await updateDoc(doc(db, collectionName, id), data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const remove = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { data, loading, error, add, update, remove };
};

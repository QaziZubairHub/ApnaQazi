import { useState, useEffect, useCallback } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "categories"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load categories");
        setLoading(false);
      }
    );
    return unsub;
  }, [version]);

  return { categories, loading, error, refresh };
}

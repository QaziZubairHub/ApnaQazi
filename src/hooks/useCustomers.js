import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

const sampleCustomers = [
  { fullName: "Qazi Zubair", email: "qazizubairleo@gmail.com", phone: "+923012991483", city: "Karachi", country: "Pakistan", totalOrders: 4, totalSpent: 15400, lastOrderDate: "2026-05-18", status: "Active" },
  { fullName: "Sania Riaz", email: "sania.riyaz@example.com", phone: "+923001112233", city: "Lahore", country: "Pakistan", totalOrders: 2, totalSpent: 7600, lastOrderDate: "2026-05-15", status: "Blocked" },
  { fullName: "Ayesha Khan", email: "ayesha.khan@example.com", phone: "+923123445566", city: "Islamabad", country: "Pakistan", totalOrders: 7, totalSpent: 22500, lastOrderDate: "2026-05-22", status: "Active" },
];

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCustomers(data.length > 0 ? data : sampleCustomers.map((c, i) => ({ id: `sample-${i}`, ...c })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status?.toLowerCase() === "active").length,
    blocked: customers.filter(c => c.status?.toLowerCase() === "blocked" || c.status?.toLowerCase() === "deactive").length,
  }), [customers]);

  return { customers, loading, stats };
};

export default useCustomers;

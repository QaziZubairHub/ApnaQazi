import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { parseNumber, parseDateValue } from "../util/helpers";

const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const ensureDefaultStatus = async (order) => {
    if (!order) return;
    const current = order.orderStatus || order.status;
    if (current) return;

    // Do not change UI/flow; silently backfill Firestore if missing.
    // This is required for older orders that may not have status set.
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "Pending",
        orderStatus: "Pending",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("[useOrders] Failed to backfill missing status for order", order?.id, error);
    }
  };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Backfill missing status for any orders missing both `status` and `orderStatus`.
      // This restores admin grouping and stats without changing checkout logic.
      await Promise.all(
        data.map(async (o) => {
          await ensureDefaultStatus(o);
        })
      );

      setOrders(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const totals = orders.reduce((acc, order) => {
      const total = parseNumber(order.totalAmount || order.paymentInfo?.totalAmount || order.subtotal || order.amount || 0);
      const status = (order.orderStatus || order.status || "Pending").toString().toLowerCase();
      acc.revenue += total;
      acc.count += 1;
      if (status === "pending") acc.pending += 1;
      if (status === "processing") acc.processing += 1;
      if (status === "packed") acc.packed += 1;
      if (status === "shipped") acc.shipped += 1;
      if (status === "delivered") acc.delivered += 1;
      if (status === "cancelled") acc.cancelled += 1;

      const orderDate = parseDateValue(order.orderDate || order.createdAt);
      if (orderDate) {
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        acc.monthMap[monthKey] = (acc.monthMap[monthKey] || 0) + total;
        const weekKey = `W${orderDate.getDay()}-${Math.floor(orderDate.getHours() / 3)}`;
        acc.heatmap[weekKey] = (acc.heatmap[weekKey] || 0) + 1;
      }
      return acc;
    }, { revenue: 0, count: 0, pending: 0, processing: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0, monthMap: {}, heatmap: {} });

    // Monthly revenue for last 6 months
    const current = new Date();
    const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(current.getFullYear(), current.getMonth() - (5 - index), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        label: d.toLocaleString("default", { month: "short" }),
        value: totals.monthMap[key] || 0,
      };
    });

    return { ...totals, monthlyRevenue };
  }, [orders]);

  const sparkData = useMemo(() => {
    return stats.monthlyRevenue.map(m => ({ value: m.value }));
  }, [stats.monthlyRevenue]);

  const updateStatus = async (id, newStatus) => {

    try {
      await updateDoc(doc(db, "orders", id), {
        status: newStatus,
        orderStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("[useOrders] Failed to update order status", { id, newStatus, error });
    }
  };

  return { orders, loading, stats, sparkData, updateStatus };
};

export default useOrders;

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { parseDateValue, timeAgo } from "../util/helpers";

const useActivityFeed = (maxItems = 20) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const ordersQ = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(maxItems));
    const customersQ = query(collection(db, "customers"), orderBy("createdAt", "desc"), limit(10));

    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
      const newActivities = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name = data.shippingAddress
          ? `${data.shippingAddress.firstName || ""} ${data.shippingAddress.lastName || ""}`.trim()
          : data.customerEmail || "Customer";
        return {
          id: doc.id,
          type: "order",
          icon: "shopping-bag",
          title: `New order created`,
          description: `Order by ${name} — ${data.paymentInfo?.totalAmount ? `Rs ${Number(data.paymentInfo.totalAmount).toLocaleString()}` : "N/A"}`,
          timestamp: parseDateValue(data.createdAt),
          timeAgo: timeAgo(parseDateValue(data.createdAt)),
          status: data.status || data.orderStatus || "Pending",
        };
      });
      setActivities(prev => {
        const nonOrder = prev.filter(a => a.type !== "order");
        return [...newActivities, ...nonOrder].sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0;
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return b.timestamp - a.timestamp;
        }).slice(0, maxItems);
      });
    });

    const unsubCustomers = onSnapshot(customersQ, (snapshot) => {
      const newActivities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "customer",
          icon: "user-plus",
          title: `New customer registered`,
          description: data.fullName || data.name || data.email || "New signup",
          timestamp: parseDateValue(data.createdAt),
          timeAgo: timeAgo(parseDateValue(data.createdAt)),
        };
      });
      setActivities(prev => {
        const nonCustomer = prev.filter(a => a.type !== "customer");
        return [...newActivities, ...nonCustomer].sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0;
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return b.timestamp - a.timestamp;
        }).slice(0, maxItems);
      });
    });

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, [maxItems]);

  return { activities };
};

export default useActivityFeed;

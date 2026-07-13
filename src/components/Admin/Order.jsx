import { useState, useEffect } from "react"
import { db } from "../../firebase"
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore"

const Order = () => {
    const [orders, setOrders] = useState([])

    useEffect(() => {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            setOrders(data)
        })
        return () => unsub()
    }, [])

  const updateStatus = async (id, newStatus) => {
      await updateDoc(doc(db, "orders", id), { status: newStatus })
  }

    return (
        <div>
            <h1 className="text-medium font-semibold">Order Page</h1>
            <div className="mt-6">
                <table className="w-full">
                    <thead>
                        <tr className="bg-indigo-600 text-white text-center">
                            <th className="py-4 px-3">Order ID</th>
                            <th className="px-3">Customer's Name</th>
                            <th className="px-3">Email</th>
                            <th className="px-3">Mobile</th>
                            <th className="px-3">Products</th>
                            <th className="px-3">Amount</th>
                            <th className="px-3">Date</th>
                            <th className="px-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o, index) => {
                            const customerName = o.shippingAddress
                                ? `${o.shippingAddress.firstName || ''} ${o.shippingAddress.lastName || ''}`.trim()
                                : o.customerEmail || "-"
                            const email = o.customerEmail || (o.shippingAddress && o.shippingAddress.email) || "-"
                            const mobile = o.shippingAddress?.phone || "-"
                            const products = (o.orderItems || []).map((i) => i.name).join(", ")
                            const amount = o.paymentInfo?.totalAmount ?? o.totalAmount ?? "-"
                            const date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString() : "-"
                            const status = o.status || "pending"

                            return (
                                <tr className="text-center border-b border-gray-100" key={o.id}
                                    style={{ background: (index + 1) % 2 === 0 ? '#E5E7EB' : 'white' }}
                                >
                                    <td className="py-4 px-3">#{o.id}</td>
                                    <td className="px-3">{customerName}</td>
                                    <td className="px-3">{email}</td>
                                    <td className="px-3">{mobile}</td>
                                    <td className="px-3 capitalize">{products}</td>
                                    <td className="px-3">{amount}</td>
                                    <td className="px-3">{date}</td>
                                    <td className="px-3">
                                        <select
                                            className="border p-2 border-gray-300 rounded"
                                            value={status}
                                            onChange={(e) => updateStatus(o.id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Order
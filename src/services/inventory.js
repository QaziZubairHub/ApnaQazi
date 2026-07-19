import { doc, runTransaction, collection } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Adjusts the stock of a product and logs the adjustment to inventoryLogs.
 * Ensures the entire product object structure is updated consistently if modified,
 * or handles transaction safety.
 *
 * @param {string} productId - ID of the product
 * @param {number} adjustment - Amount to change stock by (can be positive or negative)
 * @param {string} reason - Reason for adjustment
 */
export async function adjustStock(productId, adjustment, reason = "") {
  if (!productId) throw new Error("Product ID is required for stock adjustment");

  const productRef = doc(db, "products", productId);
  const logRef = doc(collection(db, "inventoryLogs"));

  await runTransaction(db, async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists()) {
      throw new Error("Product does not exist");
    }

    const data = productDoc.data();
    const currentQty = Number(data.stockQuantity ?? data.stock?.quantity ?? 0);
    const newQty = currentQty + adjustment;

    const stockObj = {
      quantity: newQty,
      lowStockThreshold: Number(data.lowStockThreshold ?? data.stock?.lowStockThreshold ?? 5),
      trackInventory: typeof data.trackInventory === "boolean" ? data.trackInventory : (data.stock?.trackInventory ?? true),
      allowBackorders: typeof data.allowBackorders === "boolean" ? data.allowBackorders : (data.stock?.allowBackorders ?? false),
    };

    // Update the product document with new quantities, keeping the rest of the document as is
    transaction.update(productRef, {
      stockQuantity: newQty,
      "stock.quantity": newQty,
      updatedAt: new Date().toISOString(),
    });

    // Write the log entry to inventoryLogs with a consistent schema
    transaction.set(logRef, {
      productId,
      adjustment,
      previousQuantity: currentQty,
      newQuantity: newQty,
      reason: reason || "Stock Adjustment",
      createdAt: new Date().toISOString(),
    });
  });
}

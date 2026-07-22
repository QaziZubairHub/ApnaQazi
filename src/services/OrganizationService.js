import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { logAuditEvent } from "./audit";

function singular(c) {
  return c === "categories" ? "category" : c === "brands" ? "brand" : c === "collections" ? "collection" : c.slice(0, -1);
}

async function checkDuplicate(collectionName, field, value, excludeId) {
  const snap = await getDocs(query(collection(db, collectionName), where(field, "==", value)));
  return snap.docs.some((d) => !d.data().isDeleted && d.id !== excludeId);
}

export const OrganizationService = {
  subscribeItems(collectionName, callback, options = {}) {
    const { includeDeleted = false } = options;
    if (collectionName === "all") return () => {};
    const q = query(collection(db, collectionName), where("isDeleted", "==", includeDeleted));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        callback(null, items);
      },
      (err) => {
        if (err.code === "failed-precondition") {
          callback("Missing Firestore index. Please create a composite index on isDeleted, name.");
        } else {
          callback(err.message || `Failed to load ${collectionName}`);
        }
      }
    );
  },

  async createItem(collectionName, data, user) {
    const trimmedName = (data.name || "").trim();
    const trimmedSlug = (data.slug || generateSlug(trimmedName)).trim();
    if (!trimmedName) throw new Error("Name is required");
    if (!trimmedSlug) throw new Error("Slug is required");
    if (await checkDuplicate(collectionName, "name", trimmedName)) {
      throw new Error(`A ${singular(collectionName)} with this name already exists`);
    }
    if (await checkDuplicate(collectionName, "slug", trimmedSlug)) {
      throw new Error(`A ${singular(collectionName)} with this slug already exists`);
    }
    const ref = doc(collection(db, collectionName));
    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      description: (data.description || "").trim(),
      status: data.status || "active",
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    logAuditEvent(user?.uid || "anonymous", "create", collectionName, null, { id: ref.id, ...payload });
    return ref.id;
  },

  async updateItem(collectionName, id, data, user) {
    const trimmedName = (data.name || "").trim();
    const trimmedSlug = (data.slug || "").trim();
    if (!trimmedName) throw new Error("Name is required");
    if (!trimmedSlug) throw new Error("Slug is required");
    if (await checkDuplicate(collectionName, "name", trimmedName, id)) {
      throw new Error(`A ${singular(collectionName)} with this name already exists`);
    }
    if (await checkDuplicate(collectionName, "slug", trimmedSlug, id)) {
      throw new Error(`A ${singular(collectionName)} with this slug already exists`);
    }
    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      description: (data.description || "").trim(),
      status: data.status,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, collectionName, id), payload);
    logAuditEvent(user?.uid || "anonymous", "update", collectionName, null, { id, ...payload });
  },

  async softDeleteItem(collectionName, id, user) {
    if (collectionName === "categories") {
      const productsSnap = await getDocs(
        query(collection(db, "products"), where("categoryId", "==", id))
      );
      if (productsSnap.docs.some((d) => !d.data().isDeleted)) {
        throw new Error("This category is assigned to products and cannot be deleted.");
      }
    }
    await updateDoc(doc(db, collectionName, id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user?.uid || "unknown",
      updatedAt: serverTimestamp(),
    });
    logAuditEvent(user?.uid || "anonymous", "delete", collectionName, null, { id });
  },

  async restoreItem(collectionName, id, user) {
    await updateDoc(doc(db, collectionName, id), {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp(),
    });
    logAuditEvent(user?.uid || "anonymous", "restore", collectionName, null, { id });
  },

  async toggleStatus(collectionName, id, currentStatus, user) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateDoc(doc(db, collectionName, id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    logAuditEvent(user?.uid || "anonymous", "toggleStatus", collectionName, null, { id, newStatus });
    return newStatus;
  },
};

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

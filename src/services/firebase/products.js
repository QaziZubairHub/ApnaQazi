import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  deleteDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

const PRODUCTS_COL = "products";

const toDate = (v) => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return v;
  return null;
};

export const subscribeProducts = (onData, { orderField = "createdAt" } = {}) => {
  const q = query(collection(db, PRODUCTS_COL), orderBy(orderField, "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(data);
  });
};

export const fetchProductsPage = async ({
  orderField = "createdAt",
  orderDir = "desc",
  filters = {},
}) => {
  const q = query(collection(db, PRODUCTS_COL), orderBy(orderField, orderDir));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const {
    searchText,
    categoryId,
    brandId,
    collectionId,
    vendor,
    status,
    featured,
    stock,
    priceMin,
    priceMax,
    dateFrom,
    dateTo,
    updatedFrom,
    updatedTo,
  } = filters;

  const qText = (searchText || "").trim().toLowerCase();
  const filtered = docs.filter((p) => {
    if (status && status !== "all" && p.status !== status) return false;
    if (featured === true && p.featured !== true) return false;
    if (categoryId && categoryId !== "all" && p.categoryId !== categoryId) return false;
    if (brandId && brandId !== "all" && p.brandId !== brandId) return false;
    if (collectionId && collectionId !== "all" && p.collectionId !== collectionId) return false;
    if (vendor && (p.vendor || "").toLowerCase() !== vendor.toLowerCase()) return false;

    const price = Number(p.price ?? 0);
    if (priceMin != null && !Number.isNaN(priceMin) && price < Number(priceMin)) return false;
    if (priceMax != null && !Number.isNaN(priceMax) && price > Number(priceMax)) return false;

    if (dateFrom || dateTo) {
      const d = toDate(p.createdAt);
      if (!d) return false;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }

    if (updatedFrom || updatedTo) {
      const d = toDate(p.updatedAt);
      if (!d) return false;
      if (updatedFrom && d < updatedFrom) return false;
      if (updatedTo && d > updatedTo) return false;
    }

    if (qText) {
      const hay = [
        p.name, p.slug, p.sku, p.barcode, p.brandId, p.brandName, p.categoryId, p.categoryName,
        p.vendor, p.vendorName, (p.tags || []).join(" "), p.description, p.seoTitle, p.seoKeywords,
        p.sellingPrice?.toString?.(), p.costPrice?.toString?.(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(qText)) return false;
    }

    if (stock && stock !== "all") {
      const qty = Number(p.stockQuantity ?? p.stock?.quantity ?? 0);
      const lowT = Number(p.lowStockThreshold ?? p.stock?.lowStockThreshold ?? 5);
      if (stock === "out" && qty > 0) return false;
      if (stock === "in" && qty <= 0) return false;
      if (stock === "low" && !(qty > 0 && qty <= lowT)) return false;
    }

    return true;
  });

  return { items: filtered };
};

export const fetchCollections = async (colName, { whereField = null, whereOp = null, whereValue = null } = {}) => {
  let q = query(collection(db, colName));
  if (whereField) {
    q = query(collection(db, colName), where(whereField, whereOp, whereValue));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeCollections = (
  colName,
  onData,
  { whereField = null, whereOp = null, whereValue = null } = {}
) => {
  let q = query(collection(db, colName));
  if (whereField) {
    q = query(collection(db, colName), where(whereField, whereOp, whereValue));
  }
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(items);
  });
};

export const subscribeDistinctProductStatuses = (onData) => {
  // Derive distinct values from the live products stream.
  // Note: This is O(n) client-side per snapshot; for large catalogs consider an aggregate doc.
  const q = query(collection(db, PRODUCTS_COL));
  return onSnapshot(q, (snap) => {
    const set = new Set();
    snap.docs.forEach((d) => {
      const v = d.data()?.status;
      if (typeof v === "string" && v.trim()) set.add(v.trim());
    });
    const statuses = Array.from(set).sort((a, b) => a.localeCompare(b));
    onData(statuses);
  });
};

const classifyStockBucket = (qtyRaw, lowTRaw) => {
  const qty = Number(qtyRaw ?? 0);
  const lowT = Number(lowTRaw ?? 5);
  if (qty === 0) return "out";
  if (qty > 0 && qty <= lowT) return "low";
  if (qty > lowT) return "in";
  return null;
};

export const subscribeDistinctStockStatuses = (onData) => {
  // Derive distinct stock buckets from live products.
  const q = query(collection(db, PRODUCTS_COL));
  return onSnapshot(q, (snap) => {
    const buckets = new Set();
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const qty = data.stockQuantity ?? data.stock?.quantity ?? 0;
      const lowT = data.lowStockThreshold ?? data.stock?.lowStockThreshold ?? 5;
      const bucket = classifyStockBucket(qty, lowT);
      if (bucket) buckets.add(bucket);
    });

    const order = ["in", "low", "out"];
    const result = order.filter((x) => buckets.has(x));
    onData(result);
  });
};

export const bulkUpdateProducts = async (ids, patch) => {
  if (!ids?.length) return;
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.update(doc(db, PRODUCTS_COL, id), { ...patch, updatedAt: new Date().toISOString() });
  });
  await batch.commit();
};

export const bulkDeleteProducts = async (ids) => {
  if (!ids?.length) return;
  for (const id of ids) {
    await deleteProduct(id);
  }
};

const buildSearchFields = async (data) => {
  const catName = data.categoryId
    ? (await getDoc(doc(db, "categories", data.categoryId)).then((s) => s.exists() ? s.data().name || "" : ""))
    : "";
  const brandName = data.brandId
    ? (await getDoc(doc(db, "brands", data.brandId)).then((s) => s.exists() ? s.data().name || "" : ""))
    : "";
  const collName = data.collectionId
    ? (await getDoc(doc(db, "collections", data.collectionId)).then((s) => s.exists() ? s.data().name || "" : ""))
    : "";
  const collNames = collName ? [collName] : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const tokens = [
    data.name, data.slug, data.sku, data.barcode, data.vendor,
    ...tags, catName, brandName, ...collNames,
    data.shortDescription,
  ]
    .filter(Boolean)
    .flatMap((s) => String(s).toLowerCase().split(/[\s,-]+/))
    .filter(Boolean);
  return {
    _search: [...new Set(tokens)],
    _categoryName: catName,
    _brandName: brandName,
    _collectionNames: collNames,
  };
};

export const duplicateProduct = async (id) => {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id));
  if (!snap.exists()) throw new Error("Product not found");
  const data = snap.data();
  const now = new Date().toISOString();
  const searchFields = await buildSearchFields(data);
  const payload = { ...data, ...searchFields, createdAt: now, updatedAt: now };
  const ref = doc(collection(db, PRODUCTS_COL));
  await setDoc(ref, payload);
  return { id: ref.id };
};

export const updateProduct = async (id, patch) => {
  await updateDoc(doc(db, PRODUCTS_COL, id), { ...patch, updatedAt: new Date().toISOString() });
};

const imgUrl = (entry) => (typeof entry === "string" ? entry : (entry?.url || ""));

export const deleteProduct = async (id) => {
  try {
    const snap = await getDoc(doc(db, PRODUCTS_COL, id));
    if (snap.exists()) {
      const { images } = snap.data();
      if (images?.length) {
        const { deleteFile } = await import("../storage");
        for (const entry of images) {
          try {
            const url = imgUrl(entry);
            const path = url.split("/o/")[1]?.split("?")[0];
            if (path) {
              const decodedPath = decodeURIComponent(path);
              await deleteFile(decodedPath);
            }
          } catch { /* ignore storage errors */ }
        }
      }
    }
  } catch { /* ignore */ }
  await deleteDoc(doc(db, PRODUCTS_COL, id));
};


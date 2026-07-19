import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import { genSlug, parseNumber } from "../../util/helpers";

const parseCSVLine = (line) => {
  const cols = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cols.push(cur);
  return cols;
};

export const importProductsFromCSV = async (file, onProgress) => {
  const result = await parseProductsFromCSV(file);
  if (result.errors.length) {
    throw new Error(result.errors[0]);
  }
  return commitProducts(result.valid, onProgress);
};

export const parseProductsFromCSV = async (file) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);

  const errors = [];
  if (lines.length < 2) {
    return { valid: [], duplicates: [], errors: ["CSV file has no data rows"] };
  }

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const required = ["name", "sku"];

  for (const r of required) {
    if (!header.includes(r)) {
      errors.push(`Missing required column: "${r}"`);
    }
  }
  if (errors.length) return { valid: [], duplicates: [], errors };

  const skuIndex = header.indexOf("sku");
  const barcodeIndex = header.indexOf("barcode");
  const nameIndex = header.indexOf("name");
  const priceIndex = header.indexOf("price");
  const statusIndex = header.indexOf("status");
  const stockIndex = header.indexOf("stockquantity") !== -1 ? header.indexOf("stockquantity") : header.indexOf("stock");
  const featuredIndex = header.indexOf("featured");
  const descriptionIndex = header.indexOf("description");
  const categoryIndex = header.indexOf("categoryid") !== -1 ? header.indexOf("categoryid") : header.indexOf("category");
  const brandIndex = header.indexOf("brandid") !== -1 ? header.indexOf("brandid") : header.indexOf("brand");

  const seen = new Set();
  const valid = [];
  const duplicates = [];
  const rowErrors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((k, idx) => { row[k] = cols[idx] || ""; });

    const sku = String(row[header[skuIndex]] || "").trim();
    const barcode = barcodeIndex >= 0 ? String(row[header[barcodeIndex]] || "").trim() : "";
    const key = `${sku}|${barcode}`;

    if (seen.has(key)) {
      duplicates.push(i + 1);
      continue;
    }
    seen.add(key);

    if (!sku) {
      rowErrors.push(`Row ${i + 1}: missing SKU`);
      continue;
    }

    const price = priceIndex >= 0 ? parseNumber(row[header[priceIndex]]) : 0;
    if (Number.isNaN(price) || price < 0) {
      rowErrors.push(`Row ${i + 1}: invalid price`);
    }

    valid.push({
      name: String(row[header[nameIndex]] || "").trim(),
      sku,
      barcode,
      price: Number.isNaN(price) ? 0 : price,
      status: statusIndex >= 0 ? (row[header[statusIndex]] || "draft").toLowerCase() : "draft",
      stockQuantity: stockIndex >= 0 ? parseNumber(row[header[stockIndex]]) : 0,
      featured: featuredIndex >= 0 ? row[header[featuredIndex]]?.toLowerCase() === "true" || row[header[featuredIndex]] === "1" : false,
      description: descriptionIndex >= 0 ? row[header[descriptionIndex]] : "",
      categoryId: categoryIndex >= 0 ? row[header[categoryIndex]] : "",
      brandId: brandIndex >= 0 ? row[header[brandIndex]] : "",
    });
  }

  if (rowErrors.length) errors.push(...rowErrors);

  return { valid, duplicates, errors };
};

export const commitProducts = async (valid, onProgress) => {
  if (!valid?.length) return { imported: 0, duplicates: 0 };

  if (onProgress) onProgress({ total: valid.length, current: 0 });

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  let processed = 0;

  for (const p of valid) {
    const q = query(collection(db, "products"), where("sku", "==", p.sku));
    const snap = await getDocs(q);

    let existingData = {};
    let ref;
    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      existingData = existingDoc.data() || {};
      ref = doc(db, "products", existingDoc.id);
    } else {
      ref = doc(collection(db, "products"));
    }

    const mergedPayload = {
      name: p.name ?? existingData.name ?? "",
      slug: existingData.slug || genSlug(p.name || ""),
      shortDescription: existingData.shortDescription || "",
      description: p.description ?? existingData.description ?? "",

      sku: p.sku ?? existingData.sku ?? "",
      barcode: p.barcode ?? existingData.barcode ?? "",

      price: p.price ?? existingData.price ?? 0,
      costPrice: existingData.costPrice ?? 0,
      compareAtPrice: existingData.compareAtPrice ?? 0,
      discount: existingData.discount ?? 0,
      tax: existingData.tax ?? 0,

      categoryId: p.categoryId ?? existingData.categoryId ?? "",
      brandId: p.brandId ?? existingData.brandId ?? "",
      collectionId: existingData.collectionId ?? "",
      tags: existingData.tags ?? [],
      vendor: existingData.vendor ?? "",

      featured: p.featured ?? existingData.featured ?? false,
      status: p.status ?? existingData.status ?? "draft",

      images: existingData.images ?? [],
      variants: existingData.variants ?? [],

      stockQuantity: p.stockQuantity ?? existingData.stockQuantity ?? 0,
      lowStockThreshold: existingData.lowStockThreshold ?? 5,
      trackInventory: existingData.trackInventory ?? true,
      allowBackorders: existingData.allowBackorders ?? false,

      seo: {
        metaTitle: existingData.seo?.metaTitle ?? "",
        metaDescription: existingData.seo?.metaDescription ?? "",
        keywords: existingData.seo?.keywords ?? "",
        ogImage: existingData.seo?.ogImage ?? "",
        urlSlug: existingData.seo?.urlSlug ?? existingData.slug ?? genSlug(p.name || ""),
      },

      createdAt: existingData.createdAt || now,
      updatedAt: now,
    };

    batch.set(ref, mergedPayload);

    processed++;
    if (onProgress && processed % 10 === 0) {
      onProgress({ total: valid.length, current: processed });
    }
  }

  await batch.commit();
  if (onProgress) onProgress({ total: valid.length, current: processed });

  return { imported: valid.length, duplicates: 0 };
};

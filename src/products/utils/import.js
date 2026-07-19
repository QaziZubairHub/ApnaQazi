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
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file has no data rows");
  }

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const required = ["name", "sku"];

  for (const r of required) {
    if (!header.includes(r)) {
      throw new Error(`Missing required column: "${r}"`);
    }
  }

  const skuIndex = header.indexOf("sku");
  const barcodeIndex = header.indexOf("barcode");
  const nameIndex = header.indexOf("name");
  const priceIndex = header.indexOf("price");
  const statusIndex = header.indexOf("status");
  const stockIndex = header.indexOf("stockquantity") ?? header.indexOf("stock");
  const featuredIndex = header.indexOf("featured");
  const descriptionIndex = header.indexOf("description");
  const categoryIndex = header.indexOf("categoryid") ?? header.indexOf("category");
  const brandIndex = header.indexOf("brandid") ?? header.indexOf("brand");

  const seen = new Set();
  const toUpsert = [];
  const duplicates = [];

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

    if (!sku) continue;

    toUpsert.push({
      name: String(row[header[nameIndex]] || "").trim(),
      sku,
      barcode,
      price: priceIndex >= 0 ? parseNumber(row[header[priceIndex]]) : 0,
      status: statusIndex >= 0 ? (row[header[statusIndex]] || "draft").toLowerCase() : "draft",
      stockQuantity: stockIndex >= 0 ? parseNumber(row[header[stockIndex]]) : 0,
      featured: featuredIndex >= 0 ? row[header[featuredIndex]]?.toLowerCase() === "true" || row[header[featuredIndex]] === "1" : false,
      description: descriptionIndex >= 0 ? row[header[descriptionIndex]] : "",
      categoryId: categoryIndex >= 0 ? row[header[categoryIndex]] : "",
      brandId: brandIndex >= 0 ? row[header[brandIndex]] : "",
    });
  }

  if (onProgress) onProgress({ total: toUpsert.length, current: 0 });

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  let processed = 0;

  for (const p of toUpsert) {
    const q = query(collection(db, "products"), where("sku", "==", p.sku));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existing = snap.docs[0];
      batch.update(doc(db, "products", existing.id), {
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        status: p.status,
        stockQuantity: p.stockQuantity,
        featured: p.featured,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId,
        updatedAt: now,
      });
    } else {
      const ref = doc(collection(db, "products"));
      batch.set(ref, {
        name: p.name,
        slug: genSlug(p.name),
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
        status: p.status || "draft",
        featured: p.featured || false,
        stockQuantity: p.stockQuantity || 0,
        lowStockThreshold: 5,
        description: p.description || "",
        categoryId: p.categoryId || "",
        brandId: p.brandId || "",
        images: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    processed++;
    if (onProgress && processed % 10 === 0) {
      onProgress({ total: toUpsert.length, current: processed });
    }
  }

  await batch.commit();
  if (onProgress) onProgress({ total: toUpsert.length, current: processed });

  return { imported: toUpsert.length, duplicates: duplicates.length };
};

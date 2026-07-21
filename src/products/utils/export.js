import { formatDate } from "../../util/helpers";

const csvEscape = (v) => {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadFile = (filename, content, mime = "text/plain") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const EXPORT_HEADERS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "sku", label: "SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "categoryId", label: "Category ID" },
  { key: "brandId", label: "Brand ID" },
  { key: "collectionId", label: "Collection ID" },
  { key: "price", label: "Price" },
  { key: "compareAtPrice", label: "Compare At Price" },
  { key: "costPrice", label: "Cost Price" },
  { key: "stockQuantity", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "featured", label: "Featured" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" },
];

export const exportToCSV = (products, filename = "products-export.csv") => {
  if (!products?.length) return;

  const header = EXPORT_HEADERS.map((h) => h.key);
  const body = products
    .map((p) =>
      header
        .map((k) => {
          const isDate = k === "createdAt" || k === "updatedAt";
          const v = isDate ? formatDate(p[k]) : p[k];
          return csvEscape(v);
        })
        .join(",")
    )
    .join("\n");

  const csv = `${header.join(",")}\n${body}`;
  downloadFile(filename, csv, "text/csv");
};

export const exportToJSON = (products, filename = "products-export.json") => {
  if (!products?.length) return;
  const json = JSON.stringify(products, null, 2);
  downloadFile(filename, json, "application/json");
};

export const exportToExcel = async (products, filename = "products-export.xlsx") => {
  if (!products?.length) return;
  const XLSX = await import("xlsx");
  const header = EXPORT_HEADERS.map((h) => h.label);
  const rows = products.map((p) =>
    EXPORT_HEADERS.map((h) => {
      const isDate = h.key === "createdAt" || h.key === "updatedAt";
      return isDate ? formatDate(p[h.key]) : p[h.key] ?? "";
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, filename);
};

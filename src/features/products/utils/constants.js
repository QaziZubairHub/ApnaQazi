export const PRODUCT_STATUSES = ["active", "draft", "archived"];

export const STOCK_STATUSES = ["in", "low", "out"];

export const VISIBILITY_OPTIONS = ["public", "hidden"];

export const PAGE_SIZES = [10, 25, 50, 100];

export const SORT_OPTIONS = [
  { label: "Created", value: "createdAt" },
  { label: "Updated", value: "updatedAt" },
  { label: "Name", value: "name" },
  { label: "Price", value: "price" },
  { label: "Stock", value: "stockQuantity" },
  { label: "Status", value: "status" },
];

export const BULK_ACTIONS = {
  PUBLISH: "publish",
  UNPUBLISH: "unpublish",
  ARCHIVE: "archive",
  RESTORE: "restore",
  FEATURE: "feature",
  UNFEATURE: "unfeature",
  DELETE: "delete",
  DUPLICATE: "duplicate",
  EXPORT: "export",
};

export const DEFAULT_FILTERS = {
  search: "",
  categoryId: "all",
  brandId: "all",
  collectionId: "all",
  vendor: "",
  status: "all",
  stock: "all",
  featured: false,
  visibility: "all",
  priceMin: "",
  priceMax: "",
  dateCreatedFrom: "",
  dateCreatedTo: "",
  dateUpdatedFrom: "",
  dateUpdatedTo: "",
};

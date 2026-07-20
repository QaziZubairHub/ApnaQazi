import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";

import { genSlug, parseNumber } from "../../util/helpers";
import { Tag as TagIcon } from "lucide-react";
import ProductVariantForm from "../forms/ProductVariantForm";
import { logAuditEvent } from "../../services/audit";
import { adjustStock } from "../../services/inventory";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";


const inputClass =
  "w-full px-3.5 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const ProductUpsert = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const id = mode === "edit" ? params.id : null;

  const [loading, setLoading] = useState(mode === "edit");

  // meta
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);

  // form
  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",

    sku: "",
    barcode: "",
    price: 0,
    costPrice: 0,
    compareAtPrice: 0,
    discount: 0,
    tax: 0,

    categoryId: "",
    brandId: "",
    collectionId: "",
    tags: "",
    vendor: "",

    featured: false,
    status: "draft", // draft | active | archived

    stock: { quantity: 0, lowStockThreshold: 5, trackInventory: true, allowBackorders: false },

    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      ogImage: "",
      urlSlug: "",
    },

    images: [], // image URLs
    variants: [],
    createdAt: "",
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      try {
        const [cats, br, colls] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "brands")),
          getDocs(collection(db, "collections")),
        ]);
        if (cancelled) return;
        setCategories(cats.docs.map((d) => ({ id: d.id, ...d.data() })));
        setBrands(br.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCollections(colls.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // ignore
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists()) {
          toast.error("Product not found.");
          navigate("/admin/product");
          return;
        }
        const data = snap.data();
        // normalize
        setForm((prev) => ({
          ...prev,
          ...data,
          stock: {
            quantity: data?.stockQuantity ?? data?.stock?.quantity ?? 0,
            lowStockThreshold: data?.lowStockThreshold ?? data?.stock?.lowStockThreshold ?? 5,
            trackInventory: data?.trackInventory ?? data?.stock?.trackInventory ?? true,
            allowBackorders: data?.allowBackorders ?? data?.stock?.allowBackorders ?? false,
          },
          seo: {
            metaTitle: data?.seo?.metaTitle ?? data?.metaTitle ?? "",
            metaDescription: data?.seo?.metaDescription ?? data?.metaDescription ?? "",
            keywords: data?.seo?.keywords ?? "",
            ogImage: data?.seo?.ogImage ?? "",
            urlSlug: data?.seo?.urlSlug ?? data?.slug ?? "",
          },
          images: Array.isArray(data?.images) ? data.images : [],
          variants: Array.isArray(data?.variants) ? data.variants : [],
          createdAt: data?.createdAt || "",
        }));
      } catch {
        toast.error("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, navigate]);

  useEffect(() => {
    // auto slug
    if (!form.name) return;
    setForm((p) => ({ ...p, slug: p.slug ? p.slug : genSlug(p.name) }));
  }, [form.name]);

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSEOChange = (key, value) =>
    setForm((p) => ({ ...p, seo: { ...p.seo, [key]: value } }));

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const storage = getStorage();
      const uploadedUrls = [];
      for (const file of files) {
        const path = `productImages/${Date.now()}-${file.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        uploadedUrls.push(url);
      }
      setForm((p) => ({ ...p, images: [...p.images, ...uploadedUrls] }));
      toast.success(`Uploaded ${uploadedUrls.length} image(s).`);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index) => {
    const removed = form.images[index];
    if (removed && removed.includes("firebasestorage.googleapis.com")) {
      try {
        const parts = removed.split("/o/")[1]?.split("?")[0];
        if (parts) {
          const storage = getStorage();
          const decoded = decodeURIComponent(parts);
          const ref = storageRef(storage, decoded);
          await deleteObject(ref);
        }
      } catch { /* ignore storage errors on remove */ }
    }
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const validate = async () => {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.slug.trim()) return "Slug is required.";
    if (!form.categoryId) return "Category is required.";
    if (!form.brandId) return "Brand is required.";
    if (!form.collectionId) return "Collection is required.";
    if (!form.price || Number(form.price) <= 0) return "Selling price must be greater than 0.";

    const productsRef = collection(db, "products");
    const finalSku = form.sku.trim() || `AQ-PROD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (finalSku) {
      const skuSnap = await getDocs(query(productsRef, where("sku", "==", finalSku)));
      if (!skuSnap.empty) {
        const existing = skuSnap.docs[0];
        if (existing.id !== id) return `SKU "${finalSku}" is already in use by another product.`;
      }
    }

    if (form.slug.trim()) {
      const slugSnap = await getDocs(query(productsRef, where("slug", "==", form.slug.trim())));
      if (!slugSnap.empty) {
        const existing = slugSnap.docs[0];
        if (existing.id !== id) return `Slug "${form.slug.trim()}" is already in use by another product.`;
      }
    }

    return "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = await validate();
    if (err) {
      toast.error(err);
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();

      let finalSku = form.sku.trim();
      if (!finalSku) {
        finalSku = `AQ-PROD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      const productPayload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim() || "",
        description: form.description.trim() || "",

        sku: finalSku,
        barcode: form.barcode.trim() || "",

        price: Number(form.price) || 0,
        costPrice: Number(form.costPrice) || 0,
        compareAtPrice: Number(form.compareAtPrice) || 0,
        discount: Number(form.discount) || 0,
        tax: Number(form.tax) || 0,

        categoryId: form.categoryId || "",
        brandId: form.brandId || "",
        collectionId: form.collectionId || "",
        tags: form.tags
          ? (typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags)
          : [],
        vendor: form.vendor.trim() || "",

        featured: !!form.featured,
        status: form.status || "draft",

        images: Array.isArray(form.images) ? form.images : [],
        variants: Array.isArray(form.variants) ? form.variants : [],

        stockQuantity: Number(form.stock.quantity) || 0,
        lowStockThreshold: Number(form.stock.lowStockThreshold) || 0,
        trackInventory: typeof form.stock.trackInventory === "boolean" ? form.stock.trackInventory : true,
        allowBackorders: typeof form.stock.allowBackorders === "boolean" ? form.stock.allowBackorders : false,

        seo: {
          metaTitle: form.seo.metaTitle.trim() || "",
          metaDescription: form.seo.metaDescription.trim() || "",
          keywords: form.seo.keywords.trim() || "",
          ogImage: form.seo.ogImage.trim() || "",
          urlSlug: form.seo.urlSlug.trim() || form.slug.trim() || "",
        },

        updatedAt: now,
        createdAt: mode === "create" ? now : (form.createdAt || now),
      };

      if (mode === "create") {
        const ref = doc(collection(db, "products"));
        await setDoc(ref, productPayload);
        logAuditEvent(user?.uid || "anonymous", "product_create", "products", null, productPayload);
        toast.success("Product created.");
        navigate("/admin/products");
      } else {
        const prevSnap = await getDoc(doc(db, "products", id));
        const prevData = prevSnap.exists() ? prevSnap.data() : {};
        await setDoc(doc(db, "products", id), productPayload);
        logAuditEvent(user?.uid || "anonymous", "product_update", "products", prevData, productPayload);

        const prevQty = Number(prevData.stockQuantity ?? prevData.stock?.quantity ?? 0);
        const newQty = Number(productPayload.stockQuantity ?? 0);
        if (prevQty !== newQty) {
          await adjustStock(id, newQty - prevQty, "Stock update from product edit");
        }

        toast.success("Product updated.");
        navigate("/admin/products");
      }
    } catch (err) {
      toast.error("Save failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/product")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-2"
            type="button"
          >
            ← Back to Products
          </button>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Product</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{mode === "create" ? "Create Product" : "Edit Product"}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage product details, images, inventory, and SEO.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/product")}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-100 text-primary text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Basic Information</h3>
                <p className="text-xs text-slate-500">Name, slug, and descriptions</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => onChange("name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Slug *</label>
                <input className={inputClass} value={form.slug} onChange={(e) => onChange("slug", genSlug(e.target.value))} />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Short Description</label>
              <input className={inputClass} value={form.shortDescription} onChange={(e) => onChange("shortDescription", e.target.value)} />
            </div>

            <div className="mt-4">
              <label className={labelClass}>Full Description</label>
              <textarea
                className={inputClass}
                rows={4}
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Images</h3>
                <p className="text-xs text-slate-500">Upload and preview product images</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Upload Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className={inputClass}
                  onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500 mt-2">Images are uploaded to Firebase Storage.</p>
              </div>

              <div>
                <label className={labelClass}>Featured Image</label>
                <p className="text-xs text-slate-500">In this module, first image in the list is treated as featured.</p>
              </div>
            </div>

            <div className="mt-4">
              {form.images.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                  No images uploaded.
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {form.images.map((url, idx) => (
                    <div key={url + idx} className="relative rounded-[12px] overflow-hidden border border-slate-200">
                      <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pricing & Inventory</h3>
                <p className="text-xs text-slate-500">Cost, selling price, and stock quantity</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Cost Price</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.costPrice}
                  onChange={(e) => onChange("costPrice", parseNumber(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Selling Price</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => onChange("price", parseNumber(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Compare At Price</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.compareAtPrice}
                  onChange={(e) => onChange("compareAtPrice", parseNumber(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Discount (%)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.discount}
                  onChange={(e) => onChange("discount", parseNumber(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Tax (%)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.tax}
                  onChange={(e) => onChange("tax", parseNumber(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>SKU</label>
                <input className={inputClass} value={form.sku} onChange={(e) => onChange("sku", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Barcode</label>
                <input className={inputClass} value={form.barcode} onChange={(e) => onChange("barcode", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.stock.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, stock: { ...p.stock, quantity: parseNumber(e.target.value) } }))}
                />
              </div>
              <div>
                <label className={labelClass}>Low Stock Threshold</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.stock.lowStockThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, stock: { ...p.stock, lowStockThreshold: parseNumber(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.stock.trackInventory}
                    onChange={(e) => setForm((p) => ({ ...p, stock: { ...p.stock, trackInventory: e.target.checked } }))}
                    className="accent-primary"
                  />
                  Track inventory
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.stock.allowBackorders}
                    onChange={(e) => setForm((p) => ({ ...p, stock: { ...p.stock, allowBackorders: e.target.checked } }))}
                    className="accent-primary"
                  />
                  Allow backorders
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Organization</h3>
                <p className="text-xs text-slate-500">Category, brand, and collections</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className={labelClass}>Category *</label>
                <select
                  className={inputClass}
                  value={form.categoryId}
                  onChange={(e) => onChange("categoryId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Brand *</label>
                <select
                  className={inputClass}
                  value={form.brandId}
                  onChange={(e) => onChange("brandId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Collection *</label>
                <select
                  className={inputClass}
                  value={form.collectionId}
                  onChange={(e) => onChange("collectionId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input className={inputClass} value={form.tags} onChange={(e) => onChange("tags", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Vendor</label>
                <input className={inputClass} value={form.vendor} onChange={(e) => onChange("vendor", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Variants</h3>
                <p className="text-xs text-slate-500">Configure variant attributes and combinations</p>
              </div>
            </div>
            <ProductVariantForm
              variants={form.variants}
              onChange={(variants) => onChange("variants", variants)}
            />
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon size={16} className="text-primary" />

              <h3 className="text-sm font-bold text-slate-800">Visibility</h3>

            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelClass.replace('mb-1.5','')}>Status</span>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => onChange("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={form.featured}
                  onChange={(e) => onChange("featured", e.target.checked)}
                />
                Featured
              </label>
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">SEO</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input className={inputClass} value={form.seo.metaTitle} onChange={(e) => onSEOChange("metaTitle", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.seo.metaDescription}
                  onChange={(e) => onSEOChange("metaDescription", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Keywords</label>
                <input className={inputClass} value={form.seo.keywords} onChange={(e) => onSEOChange("keywords", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>OG Image URL</label>
                <input className={inputClass} value={form.seo.ogImage} onChange={(e) => onSEOChange("ogImage", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>URL Slug</label>
                <input className={inputClass} value={form.seo.urlSlug} onChange={(e) => onSEOChange("urlSlug", genSlug(e.target.value))} />
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-slate-200 bg-white p-5">
            <button
              type="submit"
              disabled={uploading || loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-[12px] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mode === "create" ? (loading ? "Creating…" : "Create Product") : (loading ? "Saving…" : "Save Changes")}
            </button>
            <p className="text-xs text-slate-500 mt-3">Pricing and inventory are saved into the `products` document for fast admin listing.</p>
          </section>
        </div>
      </form>
    </div>
  );
};

export const ProductCreate = () => <ProductUpsert mode="create" />;
export const ProductEdit = () => <ProductUpsert mode="edit" />;

export default ProductUpsert;


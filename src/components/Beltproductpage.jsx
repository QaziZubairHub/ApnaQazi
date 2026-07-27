import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "./Layout";
import { beltProducts } from "./products.js";
import { useCart } from "../contexts/CartContext";
import pamper1 from "../assets/pamper 1.png";
import pamper2 from "../assets/pamper 2.png";
import pamper3 from "../assets/pamper 3.png";
import pamper4 from "../assets/pamper 4.png";
import pamper5 from "../assets/pamper 5.png";
import pamper6 from "../assets/pamper 6.png";
import { extractVariants } from "./shared/extractVariants";

const FALLBACK_IMAGES = [pamper1, pamper2, pamper3, pamper4, pamper5, pamper6];

const formatPrice = (value) => `Rs. ${value.toLocaleString('en-PK')}`;

const productDetailsTabs = [
  { id: "description", title: "Description" },
  {
    id: "washing",
    title: "Washing and Care",
    content: "Wipe clean with a damp cloth. Do not soak. Apply leather conditioner every 6 months to maintain premium quality."
  },
  {
    id: "shipping",
    title: "Shipping & Returns",
    content: "Free standard shipping on orders over Rs. 5,000. Standard delivery takes 3-5 business days. Easy returns within 14 days of delivery."
  }
];

const StarRating = ({ rating, totalStars = 5 }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="text-yellow-500 text-sm flex">
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
      {halfStar && <span key="half">★</span>}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="text-gray-300">★</span>)}
    </div>
  );
};

const extractValue = (data, keys, fallback) => {
  for (const key of keys) {
    const val = data[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return fallback;
};

const mapFirestoreProduct = (id, data) => {
  const v = extractVariants(data);
  const images = v.images.length > 0 ? v.images : [...FALLBACK_IMAGES];
  console.log("[ProductPage] images:", images);
  console.log("[ProductPage] colors:", v.colors);
  console.log("[ProductPage] sizes:", v.sizes);
  return {
    id,
    title: data.name || "Product",
    image: images[0] || "",
    hoverImage: images[1] || images[0] || "",
    gallery: images,
    price: Number(extractValue(data, ["price", "salePrice", "discountPrice"], 0)),
    originalPrice: Number(extractValue(data, ["originalPrice", "oldPrice", "comparePrice", "mrp", "compareAtPrice"], 0)),
    sku: data.sku || "",
    category: data._categoryName || data.categoryName || data.category || "",
    rating: Number(extractValue(data, ["rating", "stars", "averageRating"], 5)),
    reviews: data.reviews || 0,
    description: data.shortDescription || data.description || "",
    availableSizes: v.sizes,
    colors: v.colors,
    stockQuantity: Number(data.stockQuantity) || 0,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
};

const BeltProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const fallbackColors = [{ name: "Black/Brown Reversible", hex: "#000000" }];
  const [selectedColor, setSelectedColor] = useState(fallbackColors[0]);
  const [quantity, setQuantity] = useState(1);
  const [openTab, setOpenTab] = useState("description");

  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      setLoading(true);
      setSelectedImageIndex(0);
      setQuantity(1);
      setOpenTab("description");

      const staticProduct = beltProducts.find(p => p.id === parseInt(id));
      if (staticProduct) {
        const images = [staticProduct.image, staticProduct.hoverImage, ...(staticProduct.gallery || [])].filter(Boolean);
        const p = { ...staticProduct, gallery: images.length > 0 ? images : FALLBACK_IMAGES, stockQuantity: 10, tags: [], colors: staticProduct.colors || [] };
        setProduct(p);
        setSelectedSize(p.availableSizes?.[0] || "");
        const cols = p.colors?.length ? p.colors : fallbackColors;
        setSelectedColor(cols[0]);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "products", id));
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data();
          const mapped = mapFirestoreProduct(snap.id, data);
          setProduct(mapped);
          const av = mapped.availableSizes;
          setSelectedSize(av?.length > 0 ? av[0] : "Default");
          const cols = mapped.colors?.length > 0 ? mapped.colors : fallbackColors;
          setSelectedColor(cols[0]);

          const catName = data._categoryName || data.categoryName || data.category || "";
          if (catName) {
            try {
              const relatedSnap = await getDocs(
                query(collection(db, "products"), where("status", "==", "active"), where("_categoryName", "==", catName))
              );
              if (!cancelled) {
                const related = relatedSnap.docs.filter((d) => d.id !== snap.id).slice(0, 4).map((d) => mapFirestoreProduct(d.id, d.data()));
                setRelatedProducts(related);
              }
            } catch (e) {
              console.warn("[ProductPage] Could not load related products:", e.message);
            }
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("[ProductPage] Error fetching product:", err);
        setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-gray-400 text-lg animate-pulse">Loading product...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Product Not Found</h1>
          <p className="mt-4 text-gray-600">Sorry, we couldn't find the product you're looking for.</p>
          <Link to="/" className="mt-6 inline-block bg-black text-white px-6 py-3 font-semibold rounded-md hover:bg-gray-800 transition">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  const productImages = product.gallery?.length > 0
    ? product.gallery
    : [product.image, product.hoverImage].filter(Boolean);

  const savePercentage = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const hasColors = product.colors && product.colors.length > 0 && product.colors[0]?.name;
  const hasSizes = product.availableSizes && product.availableSizes.length > 0;
  const inStock = product.stockQuantity === undefined ? true : product.stockQuantity > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) return alert("Please select a size");
    const cartItem = {
      id: `${product.id}-${selectedSize || "Default"}`,
      productId: product.id,
      name: product.title,
      color: selectedColor?.name || "",
      brand: product.category,
      rating: product.rating,
      reviews: product.reviews,
      price: product.price,
      originalPrice: product.originalPrice,
      qty: quantity,
      image: product.image,
      inStock: true,
      delivery: "3-5 business days",
      saved: false,
      size: selectedSize || "Default",
      sku: product.sku,
      variant: `${selectedSize || "Default"} / ${product.sku}`,
    };
    addToCart(cartItem);
    navigate("/Cart");
  };

  const handleBuyNow = () => {
    if (hasSizes && !selectedSize) return alert("Please select a size");
    const cartItem = {
      id: `${product.id}-${selectedSize || "Default"}`,
      productId: product.id,
      name: product.title,
      color: selectedColor?.name || "",
      brand: product.category,
      rating: product.rating,
      reviews: product.reviews,
      price: product.price,
      originalPrice: product.originalPrice,
      qty: quantity,
      image: product.image,
      inStock: true,
      delivery: "3-5 business days",
      saved: false,
      size: selectedSize || "Default",
      sku: product.sku,
      variant: `${selectedSize || "Default"} / ${product.sku}`,
    };
    addToCart(cartItem);
    navigate("/Checkout");
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">

          {/* ===================== LEFT SIDE: IMAGE GALLERY ===================== */}
          <div className="flex flex-col-reverse md:flex-row gap-3 sm:gap-4">

            {productImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[600px] md:pr-2 hide-scrollbar">
                {productImages.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative cursor-pointer min-w-[70px] h-[70px] md:min-w-[90px] md:h-[90px] border-2 transition-all duration-200 ${
                      selectedImageIndex === index ? "border-black shadow-sm" : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.title} Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex-1 bg-[#f9f9f9] border border-gray-200">
              {savePercentage > 0 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs md:text-sm font-bold px-3 py-1 z-10 uppercase">
                  Save {savePercentage}%
                </span>
              )}
              <img
                src={productImages[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full min-h-[320px] sm:min-h-[420px] md:min-h-[500px] object-cover transition-opacity duration-300"
              />
            </div>
          </div>

          {/* ===================== RIGHT SIDE: PRODUCT DETAILS ===================== */}
          <div className="flex flex-col">

            <div className="text-xs text-gray-500 mb-4 tracking-wide">
              <Link to="/" className="hover:text-black">Home</Link>
              <span className="mx-1">/</span>
              <Link to={`/${(product.category || 'products').toLowerCase()}`} className="hover:text-black">{product.category || 'Products'}</Link>
              <span className="mx-1">/</span>
              <span className="text-gray-800">{product.title}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight mb-4">{product.title}</h1>

            <div className="flex items-center gap-2 mb-5">
              <StarRating rating={product.rating} />
              <a href="#reviews" className="text-sm text-blue-600 hover:underline">({product.reviews} Reviews)</a>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice > 0 && (
                <span className="text-xl text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <div className="bg-gray-100 border border-gray-200 px-4 py-2 mb-6 text-xs text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span><strong className="text-red-600">EXCLUSIVE PROMO:</strong> Extra 5% off on prepaid orders at checkout!</span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6 pb-6 border-b border-gray-200">
              {product.description}
            </p>

            {/* COLOR SELECTION */}
            {hasColors && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-900">Color:</span>
                  <span className="text-sm text-gray-600">{selectedColor?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor.name === color.name ? "border-black shadow-md scale-110" : "border-gray-300 hover:border-gray-500"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor.name === color.name && (
                        <svg className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE SELECTION */}
            {hasSizes && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 w-max gap-4">
                  <span className="text-sm font-medium text-gray-900">Size:</span>
                  <a href="#" className="text-xs text-blue-600 hover:underline">Size Guide</a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[45px] h-10 px-3 border text-sm font-medium transition-all duration-200 ${
                        selectedSize === size ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STOCK STATUS */}
            <div className={`flex items-center gap-2 mb-6 text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={inStock ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
              {inStock ? "In Stock" : "Out of Stock"}
            </div>

            {/* CART BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <div className="flex border border-gray-300 rounded-md overflow-hidden self-start">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 text-gray-600 hover:bg-gray-100 transition">-</button>
                <input type="number" value={quantity} readOnly className="w-12 text-center border-x border-gray-300 py-2 text-sm outline-none" />
                <button onClick={() => setQuantity((q) => q + 1)} className="px-4 text-gray-600 hover:bg-gray-100 transition">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 min-h-[46px] bg-red-600 text-white py-3 font-bold tracking-wider text-sm hover:bg-red-700 transition-colors duration-200"
              >
                ADD TO CART
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="w-full min-h-[46px] border-2 border-black py-3 font-semibold tracking-wider text-sm text-black hover:bg-black hover:text-white transition-all duration-200 mb-6"
            >
              BUY IT NOW
            </button>

            <div className="text-xs text-gray-500 space-y-2 pb-6 border-b border-gray-200">
              {product.sku && <p><span className="font-medium text-gray-700">SKU:</span> {product.sku}</p>}
              {product.category && (
                <p><span className="font-medium text-gray-700">Category:</span> <Link to={`/${product.category.toLowerCase()}`} className="underline hover:text-black">{product.category}</Link></p>
              )}
              {product.tags && product.tags.length > 0 && (
                <p>
                  <span className="font-medium text-gray-700">Tags:</span>{" "}
                  {product.tags.map((tag, i) => (
                    <span key={i} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">{tag}</span>
                  ))}
                </p>
              )}
            </div>

            {/* ACCORDION */}
            <div className="mt-6">
              <div className="border-b border-gray-200">
                {productDetailsTabs.map((tab) => {
                  let content = tab.content;
                  if (tab.id === 'description') content = product.description;

                  return (
                  <div key={tab.id} className="border-t border-gray-200">
                    <button
                      onClick={() => setOpenTab(openTab === tab.id ? null : tab.id)}
                      className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-sm md:text-base font-semibold text-gray-900">{tab.title}</h3>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${openTab === tab.id ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openTab === tab.id ? "max-h-96 pb-4" : "max-h-0"}`}>
                      <p className="text-gray-600 text-sm leading-relaxed pr-8">{content}</p>
                    </div>
                  </div>
                  )
                })}
              </div>

              {/* Share Section */}
              <div className="flex items-center mt-6 mb-2">
                <span className="text-sm font-semibold text-gray-800 mr-4">Share:</span>
                <div className="flex items-center gap-3">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors" title="Share on Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rp) => (
                <Link key={rp.id} to={`/product/${rp.id}`} className="group">
                  <div className="aspect-square bg-[#f5f5f5] overflow-hidden rounded-sm mb-3">
                    <img
                      src={rp.image || "https://via.placeholder.com/400"}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{rp.title}</h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(rp.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default BeltProductPage;

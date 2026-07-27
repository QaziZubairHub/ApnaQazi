import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Layout from "./Layout";

import groceryHero1 from "../assets/Groceryimage.png";
import groceryHero2 from "../assets/shopinggro.jpg";
import groceryHero3 from "../assets/Grocessory.png";

const heroSlides = [
  { id: 1, image: groceryHero1, alt: "Grocery Collection" },
  { id: 2, image: groceryHero2, alt: "Fresh Groceries" },
  { id: 3, image: groceryHero3, alt: "Daily Essentials" },
];

const formatPrice = (value) => `Rs. ${value.toLocaleString('en-PK')}`;

const StarRating = ({ rating, totalStars = 5 }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="text-amber-400 text-[12px] sm:text-[14px] flex gap-[2px]">
      {[...Array(fullStars)].map((_, i) => <i key={`full-${i}`} className="ri-star-fill"></i>)}
      {halfStar && <i className="ri-star-half-fill"></i>}
      {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="ri-star-line"></i>)}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const savePercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <article className="group flex flex-col relative h-full">
      <div className="relative w-full aspect-square bg-[#f5f5f5] overflow-hidden rounded-sm">

        {savePercentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 z-30 uppercase tracking-wider rounded-sm shadow-sm">
            SAVE {savePercentage}%
          </span>
        )}

        <Link to={`/product/${product.id}`} className="absolute inset-0 z-20">
          <span className="sr-only">View {product.title}</span>
        </Link>

        <img
          src={product.image || "https://via.placeholder.com/400?text=Image+1"}
          alt={product.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0 z-10"
        />

        <img
          src={product.hoverImage || product.image || "https://via.placeholder.com/400?text=Image+2"}
          alt={`${product.title} alternate view`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100 z-0"
        />

        <div className="absolute bottom-0 left-0 w-full p-3 z-30 translate-y-4 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 ease-out">
          <button
            onClick={handleQuickView}
            className="w-full bg-white/95 backdrop-blur-sm py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-800 font-semibold hover:bg-black hover:text-white transition-colors duration-300 shadow-lg rounded-sm"
          >
            Quick view
          </button>
        </div>

      </div>

      <div className="mt-4 text-center px-1 flex flex-col flex-grow items-center">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-[13px] sm:text-[14px] font-medium text-gray-800 leading-snug hover:text-black transition-colors line-clamp-2 px-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <div className="mt-2.5 flex justify-center items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-[11px] sm:text-[13px] text-gray-500">
            {product.reviews} reviews
          </span>
        </div>

        {product.colorsText && (
          <p className="mt-1.5 text-[11px] sm:text-[13px] text-gray-400">{product.colorsText}</p>
        )}
      </div>
    </article>
  );
};

const isGroceryProduct = (p) => {
  if (String(p._categoryName || "").toLowerCase().includes("grocery")) return true;
  if (String(p.categoryName || "").toLowerCase().includes("grocery")) return true;
  if (String(p.category || "").toLowerCase().includes("grocery")) return true;
  if (String(p.categorySlug || "").toLowerCase().includes("grocery")) return true;
  if (String(p.slug || "").toLowerCase().includes("grocery")) return true;
  if (Array.isArray(p._search) && p._search.some((t) => String(t).toLowerCase().includes("grocery"))) return true;
  return false;
};

const Grocery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        console.log("[Grocery] STEP 1: Fetching active products");
        const prodSnap = await getDocs(
          query(collection(db, "products"), where("status", "==", "active"))
        );
        console.log("[Grocery] STEP 2: Products retrieved:", prodSnap.size);

        if (cancelled) return;

        const allProducts = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        console.log("[Grocery] STEP 3: Filtering products by grocery fields");
        const filtered = allProducts.filter((p) => {
          const passed = isGroceryProduct(p);
          console.log(
            "[Grocery] Product:", p.name,
            "| _categoryName:", p._categoryName,
            "| categoryName:", p.categoryName,
            "| category:", p.category,
            "|", passed ? "ACCEPTED" : "REJECTED"
          );
          return passed;
        });

        console.log("[Grocery] STEP 4: Products after filtering:", filtered.length);

        const mapped = filtered.map((p) => {
          const firstImg = Array.isArray(p.images) && p.images.length > 0
            ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url || "")
            : p.image || "";
          const secondImg = Array.isArray(p.images) && p.images.length > 1
            ? (typeof p.images[1] === "string" ? p.images[1] : p.images[1]?.url || "")
            : firstImg;

          return {
            id: p.id,
            title: p.name || "Product",
            image: firstImg,
            hoverImage: secondImg,
            price: Number(p.price) || 0,
            originalPrice: Number(p.compareAtPrice) || 0,
            rating: p.rating || 5,
            reviews: p.reviews || 0,
            colorsText: p.colorsText || "",
          };
        });

        console.log("[Grocery] STEP 5: Mapped products:", mapped.length);

        setProducts(mapped);
      } catch (err) {
        console.error("[Grocery] Error:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          console.log("[Grocery] STEP 6: Render complete");
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <Layout>
      <section className="w-full overflow-hidden bg-gray-50">
        <Swiper
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          speed={800}
          loop={true}
          modules={[Pagination, Autoplay]}
          className="hero-swiper"
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <img
                src={slide.image}
                alt={slide.alt}
                fetchpriority={slide.id === 1 ? "high" : "auto"}
                className="w-full h-[250px] md:h-[400px] lg:h-[500px] object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <header className="pt-12 pb-8 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Grocery Collection</h1>
        <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
          Fresh groceries and daily essentials delivered to your doorstep.
        </p>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No grocery products found.</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Grocery;

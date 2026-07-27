import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Layout from "./Layout";
import { ProductCard } from "./shared/ProductCard";
import { extractVariants } from "./shared/extractVariants";

import groceryHero1 from "../assets/Groceryimage.png";
import groceryHero2 from "../assets/shopinggro.jpg";
import groceryHero3 from "../assets/Grocessory.png";

const heroSlides = [
  { id: 1, image: groceryHero1, alt: "Grocery Collection" },
  { id: 2, image: groceryHero2, alt: "Fresh Groceries" },
  { id: 3, image: groceryHero3, alt: "Daily Essentials" },
];

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
          const v = extractVariants(p);
          const images = v.images.length > 0 ? v.images : [];
          console.log("[Grocery] Product:", p.name, "| images:", images, "| colors:", v.colors, "| sizes:", v.sizes);
          const price = Number(p.price ?? p.salePrice ?? p.discountPrice ?? 0);
          const origPrice = Number(p.originalPrice ?? p.oldPrice ?? p.comparePrice ?? p.mrp ?? p.compareAtPrice ?? 0);

          return {
            id: p.id,
            title: p.name || "Product",
            image: images[0] || "",
            hoverImage: images[1] || images[0] || "",
            price,
            originalPrice: origPrice,
            rating: Number(p.rating ?? p.stars ?? p.averageRating ?? 5),
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

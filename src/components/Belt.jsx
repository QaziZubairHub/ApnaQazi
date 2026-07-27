import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Layout from "./Layout";
import { ProductCard } from "./shared/ProductCard";

// Import images
import belt11Img from "../assets/belt11.png"; 
import belt12Img from "../assets/belt12.png"; 
import belt13Img from "../assets/belt13.png"; 
import beltcover1Img from "../assets/beltcover1.jpg"; 
import { beltProducts } from "./products.js";

const heroSlides = [
  { id: 1, image: belt12Img, alt: "Moderne Slider Belt" }, 
  { id: 2, image: belt13Img, alt: "Premium Belts Display" },
  { id: 3, image: belt11Img, alt: "Classic Belts" },
  { id: 4, image: beltcover1Img, alt: "Leather Belts" },
];

// --- Main Component ---
const Belt = () => {
  return (
    <Layout>
      {/* ====================== Hero Section ========================== */}
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
                fetchpriority={slide.id === 1 ? "high" : "auto"} // Improves Core Web Vitals
                className="w-full h-[250px] md:h-[400px] lg:h-[500px] object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ====================== Header ========================== */}
      <header className="pt-12 pb-8 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Premium Belts Collection</h1>
        <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
          Explore our finest leather belts and accessories crafted for modern elegance and durability.
        </p>
      </header>

      {/* ====================== Product Grid ========================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {beltProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Belt;
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Layout from "./Layout";

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

// --- Utility Functions ---
const formatPrice = (value) => `Rs. ${value.toLocaleString('en-PK')}`;

// --- Sub-Components ---
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

// INDUSTRY STANDARD: Extracted ProductCard component for clean architecture & reusability
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const savePercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  // Handle Quick View button click cleanly
  const handleQuickView = (e) => {
    e.preventDefault(); // Anchor tag ki default working rokne ke liye
    e.stopPropagation(); // Event bubbling rokne ke liye
    navigate(`/product/${product.id}`);
  };

  return (
    <article className="group flex flex-col relative h-full">
      {/* Product Image Box */}
      <div className="relative w-full aspect-square bg-[#f5f5f5] overflow-hidden rounded-sm">
        
        {/* Discount Badge */}
        {savePercentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 z-30 uppercase tracking-wider rounded-sm shadow-sm">
            SAVE {savePercentage}%
          </span>
        )}

        {/* Semantic Link spanning the whole image for SEO */}
        <Link to={`/product/${product.id}`} className="absolute inset-0 z-20">
          <span className="sr-only">View {product.title}</span>
        </Link>

        {/* Main Product Image */}
        <img 
          src={product.image || "https://via.placeholder.com/400?text=Image+1"} 
          alt={product.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0 z-10"
        />

        {/* Hover Product Image */}
        <img 
          src={product.hoverImage || product.image || "https://via.placeholder.com/400?text=Image+2"} 
          alt={`${product.title} alternate view`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100 z-0"
        />

        {/* FIXED Quick View Button */}
        {/* Industry standard animation: use opacity & slight transform, plus pointer-events to prevent click blocking when hidden */}
        <div className="absolute bottom-0 left-0 w-full p-3 z-30 translate-y-4 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 ease-out">
          <button 
            onClick={handleQuickView}
            className="w-full bg-white/95 backdrop-blur-sm py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-800 font-semibold hover:bg-black hover:text-white transition-colors duration-300 shadow-lg rounded-sm"
          >
            Quick view
          </button>
        </div>

      </div>

      {/* Product Details */}
      <div className="mt-4 text-center px-1 flex flex-col flex-grow items-center">
        {/* SEO friendly heading link */}
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
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from "./Layout";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules'; 
import 'swiper/css';
import 'swiper/css/pagination';

// Imports
import heroImg    from "../assets/hero.png"; 
import ringImg    from "../assets/ring.jpg";
import earingImg  from "../assets/earingset.jpg";
import banner1    from "../assets/1banner.png";
import banner11   from "../assets/11banner.png";
import banner12   from "../assets/12banner.png";
import jewelleryImg  from "../assets/Jewellery.png"; 
import BrandImg      from "../assets/Brand cloths.webp";
import BeltImg       from "../assets/Belt.jpg";
import SunglassImg   from "../assets/Sunglass.png";
import GrocessoryImg from "../assets/Grocessory.png";
import WatchesImg    from "../assets/Watches.jpg";
import Watch1Img     from "../assets/Watches.1jpg.png";
import Watch2Img     from "../assets/Watches.2jpg.png";
import Watch3Img     from "../assets/Watches.3jpg.png";
import cloth1Img     from "../assets/Cloth1.jpeg";
import cloth2Img     from "../assets/Cloth2.jpeg";
import cloth3Img     from "../assets/Cloth3.jpeg";
import cloth4Img     from "../assets/Cloth4.jpeg";
import Necklaces1Img from "../assets/Necklaces1.png";
import coverbgpicImg from "../assets/coverbg pic.jpg";
import coverbgblackImg from "../assets/coverbgblack.png";
import GroceryImg   from "../assets/Groceryimage.png";
import GENERICImg from "../assets/GENERIC.JPG";
import shopingGroImg  from "../assets/shopinggro.jpg";
import shampoImg      from "../assets/shampo.jpg";
import masalaImg      from "../assets/masala.jpg";
import toiletItemImg  from "../assets/toiletitem.png";
import Belt1Img from "../assets/Belt1.png";
import beltcover1Img from "../assets/beltcover1.jpg";

// Data Arrays
const heroSlides = [
  { id: 1, image: heroImg, alt: "Hero Banner" }, { id: 2, image: earingImg, alt: "Earrings" },
  { id: 3, image: banner1, alt: "Banner 1" }, { id: 4, image: banner11, alt: "Banner 11" },
  { id: 5, image: banner12, alt: "Banner 12" }, { id: 6, image: beltcover1Img, alt: "Belt Cover" },
  {id: 7, image: coverbgpicImg, alt: "coverbgpic"}, {id: 8, image: coverbgblackImg, alt: "coverbgblack"},
  {id: 9, image: GroceryImg, alt: "Grocery"}, {id: 10, image: GENERICImg, alt: "GENERIC"}
];

const categories = [
  { id: 1, title: "Jewellery",     image: jewelleryImg,  link: "/jewellery" },
  { id: 2, title: "Brand Clothes", image: BrandImg,      link: "/Brand cloths" },
  { id: 3, title: "Belt",          image: BeltImg,       link: "/Belt" },
  { id: 4, title: "Grocery",       image: GrocessoryImg, link: "/Grocessory" },
  { id: 5, title: "Watches",       image: WatchesImg,    link: "/watches" },
  { id: 6, title: "Sunglass",      image: SunglassImg,   link: "/Sunglass" },
  { id: 7, title: "Leather Jacket", image: "https://z-cdn-media.chatglm.cn/files/c5b7d69a-e46d-4345-9d5a-da2ec27db480.png?auth_key=1882559984-224e6ca4307c4ab2b743a340e5ed5654-0-2cb86a993c86fa1d9ad04f24e1fae1d5", link: "/leather-jackets" },
];

const features = [
  { id: 1, icon: "🚚", title: "Free Shipping",    desc: "Free shipping Rs.10k orders" },
  { id: 2, icon: "✅", title: "Money Guarantee",  desc: "Easy returns within 30 days" },
  { id: 3, icon: "🎧", title: "Online Support",   desc: "24 hours a day, 7 days a week" },
  { id: 4, icon: "💳", title: "Flex Payment",     desc: "Easypaisa, JazzCash & cards" },
];

const sunglassProducts = [
  { id: 1, name: "Classic Aviator", modelSet: "Summer 2026", image: SunglassImg, badge: "New" },
  { id: 2, name: "Retro Square Sunglasses", modelSet: "Summer 2026", image: SunglassImg, badge: "Sale" },
  { id: 3, name: "Vintage Round Glasses", modelSet: "Summer 2026", image: SunglassImg, badge: "Premium" },
  { id: 4, name: "Luxury Cat Eye", modelSet: "Summer 2026", image: SunglassImg, badge: "Exclusive" },
];
const jewelleryProducts = [
  { id: 1, name: "Necklaces", modelSet: " Summer 2026 - 2027", image: Necklaces1Img, badge: "New"},
  { id: 2, name: "Diamond Drop Earrings", modelSet: "Summer 2026 - 2027", image: earingImg, badge: "Sale"},
  { id: 3, name: "Luxury Jewellery Set", modelSet:  "Summer 2026 - 2027", image: jewelleryImg, badge: "Premium"},
  { id: 4, name: "Rose Gold Minimalist Ring", modelSet: "Summer 2026 - 2027", image: ringImg, badge: "Exclusive"},
];
const beltProducts = [
  { id: 1, name: "Classic Leather Belt", modelSet: "Summer 2026", image: BeltImg, badge: "New" },
  { id: 2, name: "Casual Web Belt", modelSet: "Summer 2026", image: Belt1Img, badge: "Sale" },
  { id: 3, name: "Casual Belt", modelSet: "Summer 2026", image: BeltImg, badge: "Premium" },
  { id: 4, name: "Formal Belt", modelSet: "Summer 2026", image: BeltImg, badge: "Exclusive" },
];
const watchProducts = [
  { id: 1, name: "Classic Watch", modelSet: "Summer 2026", image: WatchesImg, badge: "New" },
  { id: 2, name: "Sport Watch", modelSet: "Summer 2026", image: Watch1Img, badge: "Sale" },
  { id: 3, name: "Luxury Watch", modelSet: "Summer 2026", image: Watch2Img, badge: "Premium" },
  { id: 4, name: "Formal Watch", modelSet: "Summer 2026", image: Watch3Img, badge: "Exclusive" },
];
const brandClothProducts = [
  { id: 1, name: "Classic Cloth", modelSet: "Summer 2026", image: cloth1Img, badge: "New" },
  { id: 2, name: "Sport Cloth", modelSet: "Summer 2026", image: cloth2Img, badge: "Sale" },
  { id: 3, name: "Luxury Cloth", modelSet: "Summer 2026", image: cloth3Img, badge: "Premium" },
  { id: 4, name: "Formal Cloth", modelSet: "Summer 2026", image: cloth4Img, badge: "Exclusive" },
];

// ── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(text, speed = 110, pause = 2000) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0; let forward = true; let timeout;
    const tick = () => {
      if (forward) { i++; setDisplay(text.slice(0, i)); if (i === text.length) { forward = false; timeout = setTimeout(tick, pause); return; } }
      else { i = 0; forward = true; setDisplay(''); }
      timeout = setTimeout(tick, speed);
    };
    timeout = setTimeout(tick, speed);
    return () => clearTimeout(timeout);
  }, [text, speed, pause]);
  return display;
}
const Cursor = () => (<span className="inline-block w-[2px] h-[1em] bg-[#c79864] ml-0.5 align-middle animate-pulse" />);


// ════════════════════════════════════════════════════════════════════════════
// 🌟 INDUSTRY LEVEL REUSABLE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const ProductCard = ({ prod, linkTo }) => (
  <Link to={linkTo || `/product/${prod.id}`} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-gray-100/80 block">
    <div className="relative h-[200px] sm:h-[280px] w-full overflow-hidden bg-gray-50">
      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      
      {prod.badge && <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#c79864] text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm border border-[#c79864]/20">{prod.badge}</span>}
      
      <button className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-all z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 shadow-sm">
        <i className="ri-heart-line text-base"></i>
      </button>

      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-center py-4 text-[11px] font-bold tracking-widest transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex items-center justify-center gap-2">
        <i className="ri-eye-line text-sm"></i> QUICK VIEW
      </div>
    </div>
    
    <div className="p-4 sm:p-5 text-center">
      <div className="text-yellow-400 text-[12px] sm:text-[13px] mb-2 flex justify-center gap-0.5"><i className="ri-star-fill"></i><i className="ri-star-fill"></i><i className="ri-star-fill"></i><i className="ri-star-fill"></i><i className="ri-star-half-line"></i></div>
      <h3 className="text-gray-800 font-semibold text-[13px] sm:text-[15px] mb-2 truncate group-hover:text-[#c79864] transition-colors duration-300">{prod.name}</h3>
      <p className="inline-block bg-[#fdf4ea] text-[#c79864] px-3 py-1 rounded-full text-[10px] font-semibold">{prod.modelSet}</p>
      {/* ❌ PRICE SECTION YAHAN SE HATA DIYA GAYA HAI */}
    </div>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[4px] bg-[#c79864] transition-all duration-500 group-hover:w-full"></div>
  </Link>
);

const SectionHeading = ({ prefix, typingWord }) => (
  <div className="text-center mb-10 md:mb-14">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 uppercase tracking-wider">
      {prefix}{' '}<span className="text-[#c79864]">{typingWord}<Cursor /></span>
    </h2>
    <div className="w-24 h-1 bg-[#c79864] mx-auto mt-4 rounded-full" />
  </div>
);

const ViewAllBtn = ({ to, text }) => (
  <div className="text-center mt-12">
    <Link to={to} className="group/btn inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold text-[12px] sm:text-[14px] uppercase tracking-wider px-8 py-3 rounded-full hover:bg-[#c79864] hover:text-white hover:border-[#c79864] transition-all duration-300 shadow-sm hover:shadow-lg">
      {text}
      <i className="ri-arrow-right-line transition-transform duration-300 group-hover/btn:translate-x-1"></i>
    </Link>
  </div>
);


// ── Home Page ─────────────────────────────────────────────────────────────────
const Home = () => {
  const categoryWord  = useTypewriter('Category',  110, 2000);
  const jewelleryWord = useTypewriter('Jewellery', 110, 2000);
  const sunglassWord  = useTypewriter('Sunglasses', 110, 2000);
  const beltWord      = useTypewriter('Belts', 110, 2000);
  const watchWord     = useTypewriter('Watches', 110, 2000);
  const clothesWord   = useTypewriter('Clothes', 110, 2000);
  const groceryWord   = useTypewriter('Grocery', 110, 2000);
  const jacketWord    = useTypewriter('Leather Jacket', 110, 2000);

  return (
    <Layout>

      {/* ====================== Cinematic Hero Section ========================== */}
      <section className="w-full overflow-hidden relative">
        <Swiper pagination={{ clickable: true }} autoplay={{ delay: 3000, disableOnInteraction: false }} speed={1000} loop={true} modules={[Pagination, Autoplay]} className="hero-swiper">
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative">
                <img src={slide.image} alt={slide.alt} className="w-full h-[250px] md:h-[400px] lg:h-[550px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ====================== Feature Bar ========================== */}
      <section className="bg-white border-b border-gray-100 shadow-sm relative z-10">
        <div className="w-full mx-auto px-2 md:px-6 py-2 md:py-5">
          <div className="grid grid-cols-4 gap-1 md:gap-4">
            {features.map((f) => (
              <div key={f.id} className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-1 md:gap-3 px-1 py-2 md:px-4 md:py-4 rounded-xl bg-gray-50 hover:bg-[#fdf6ec] transition-all duration-300 group hover:shadow-md min-w-0">
                <div className="flex-shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-full bg-[#c79864]/10 flex items-center justify-center text-[18px] md:text-[22px] group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <span className="text-[10px] md:text-[14px] font-bold text-gray-800 leading-tight">{f.title}</span>
                  <span className="hidden md:block text-[11px] md:text-[12px] text-gray-500 mt-0.5 leading-tight">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== Main Content Area ========================== */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-16 bg-gray-50/80">
        <div className="w-full px-4 md:px-0 md:w-11/12 mx-auto">

          <SectionHeading prefix="Shop by" typingWord={categoryWord} />
          
          <Swiper loop={true} grabCursor={true} spaceBetween={20} autoplay={{ delay: 2000, disableOnInteraction: false, pauseOnMouseEnter: true }} speed={800} breakpoints={{ 0: { slidesPerView: 2 }, 640: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 5 }, }} modules={[Autoplay]} className="py-5 mb-10">
            {categories.map((category) => (
              <SwiperSlide key={category.id} className="flex justify-center pb-4">
                <Link to={category.link} className="group cursor-pointer block mx-auto">
                  <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[170px] md:h-[170px] rounded-full overflow-hidden shadow-lg border-4 border-white transition-all duration-500 group-hover:border-[#c79864] group-hover:shadow-[0_10px_30px_-10px_rgba(199,152,100,0.6)]">
                    <img src={category.image} alt={category.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1.5 rounded-full shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:scale-110">
                      <span className="text-[12px] md:text-[14px] font-bold text-gray-800 whitespace-nowrap uppercase tracking-wide">{category.title}</span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <SectionHeading prefix="New Collection" typingWord={jewelleryWord} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {jewelleryProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
          </div>
          <ViewAllBtn to="/jewellery" text="View All Jewellery" />

          <div className="mt-16 md:mt-24">
            <SectionHeading prefix="Shop by" typingWord={sunglassWord} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {sunglassProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
            </div>
            <ViewAllBtn to="/sunglasses" text="View All Sunglasses" />
          </div>

          <div className="mt-16 md:mt-24">
            <SectionHeading prefix="Shop by" typingWord={watchWord} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {watchProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
            </div>
            <ViewAllBtn to="/watches" text="View All Watches" />
          </div>

          <div className="mt-16 md:mt-24">
            <SectionHeading prefix="Shop by" typingWord={beltWord} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {beltProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
            </div>
            <ViewAllBtn to="/Belt" text="View All Belts" />
          </div>

          <div className="mt-16 md:mt-24">
            <SectionHeading prefix="Shop by" typingWord={clothesWord} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {brandClothProducts.map((prod) => <ProductCard key={prod.id} prod={prod} />)}
            </div>
            <ViewAllBtn to="/brand-clothes" text="View All Brand Clothes" />
          </div>

        </div>

        <div className="w-full px-4 md:px-0 md:w-11/12 mx-auto mt-16 md:mt-24">
          <SectionHeading prefix="Shop by" typingWord={groceryWord} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { id: 1, name: 'Shoping Gro', image: shopingGroImg, modelSet: "Grocery Essentials" },
              { id: 2, name: 'Shampo', image: shampoImg, modelSet: "Grocery Essentials" },
              { id: 3, name: 'Masala', image: masalaImg, modelSet: "Grocery Essentials" },
              { id: 4, name: 'Toilet Items', image: toiletItemImg, modelSet: "Grocery Essentials" },
            ].map((prod) => <ProductCard key={prod.id} prod={prod} linkTo="/grocery" />)}
          </div>
          <ViewAllBtn to="/grocery" text="View All Grocery" />
        </div>

        <div className="w-full px-4 md:px-0 md:w-11/12 mx-auto mt-16 md:mt-24">
          <SectionHeading prefix="Shop by" typingWord={jacketWord} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { id: 1, name: 'Black Zipper Leather Jacket', modelSet: "Winter Collection 2026", image: "https://z-cdn-media.chatglm.cn/files/c5b7d69a-e46d-4345-9d5a-da2ec27db480.png?auth_key=1882559984-224e6ca4307c4ab2b743a340e5ed5654-0-2cb86a993c86fa1d9ad04f24e1fae1d5" },
              { id: 2, name: 'Brown Suede Casual Jacket', modelSet: "Winter Collection 2026", image: "https://z-cdn-media.chatglm.cn/files/1c4a9a7f-5c98-4e23-ac8a-04b2eb2b2c61.png?auth_key=1882559984-c231ab6984d74db6bc358f9ec103552e-0-cdb1160d27d22d0db09f576772e50a6a" },
              { id: 3, name: 'Black Hooded Leather Jacket', modelSet: "Winter Collection 2026", image: "https://z-cdn-media.chatglm.cn/files/75426710-9b85-4576-8082-dcb2ea772ad8.png?auth_key=1882559984-f733b14213d44b789caf1498187f246f-0-6b9e61bc35406203a3be69471c0d1147" },
              { id: 4, name: 'BJ Premium Black Jacket', modelSet: "Winter Collection 2026", image: "https://z-cdn-media.chatglm.cn/files/10479f21-a60e-4d1b-ab05-b52179d2add9.png?auth_key=1882559984-2354eae5b6bb4638a175252466975038-0-d831581397fb8ddb9233cc0106ed1c39" },
            ].map((prod) => <ProductCard key={prod.id} prod={prod} linkTo="/leather-jackets" />)}
          </div>
          <div className="text-center mt-12 pb-4">
            <ViewAllBtn to="/leather-jackets" text="View All Leather Jackets" />
          </div>
        </div>

      </section>
    </Layout>
  );
};

export default Home;
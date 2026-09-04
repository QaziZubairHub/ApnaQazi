import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from './Layout';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { ProductCard } from '../shared/ProductCard';

const CATEGORY_FALLBACK_IMAGES = {
  belts: ['belt11', 'belt12', 'belt13', 'beltcover1'],
  grocery: ['Groceryimage', 'shopinggro', 'Grocessory', 'BabyPamper'],
  watches: ['Watches', 'Watches.1', 'Watches.2', 'Watches.3', 'Watches.4'],
  default: ['GENERIC', 'hero', 'fashion-sales'],
};

const getFallbackImages = (categorySlug) => {
  const key = (categorySlug || '').toLowerCase();
  return CATEGORY_FALLBACK_IMAGES[key] || CATEGORY_FALLBACK_IMAGES.default;
};

const fallbackAssets = import.meta.glob("../assets/*.{png,jpg,jpeg}", {
  eager: true,
  import: "default",
});

const loadImage = (name) => {
  return (
    fallbackAssets[`../assets/${name}.png`] ||
    fallbackAssets[`../assets/${name}.jpg`] ||
    fallbackAssets[`../assets/${name}.jpeg`] ||
    null
  );
};

const CategoryTemplate = () => {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorySlug = window.location.pathname.split('/').pop();

  useEffect(() => {
    let cancelled = false;
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const catRef = doc(db, 'categories', categorySlug);
        const catSnap = await getDoc(catRef);

        if (!catSnap.exists() && !cancelled) {
          const altRef = doc(db, 'categories', catSnap.id.toLowerCase());
          const altSnap = await getDoc(altRef);
          if (altSnap.exists()) {
            setCategory({ id: altSnap.id, ...altSnap.data() });
          } else {
            setError('Category not found');
            return;
          }
        } else if (!cancelled) {
          setCategory({ id: catSnap.id, ...catSnap.data() });
        }

        if (!cancelled) {
          const productsQuery = query(
            collection(db, 'products'),
            where('status', '==', 'active'),
            where('categoryId', '==', categorySlug)
          );
          const productsSnap = await getDocs(productsQuery);
          const productData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setProducts(productData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[CategoryTemplate] Error:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategory();
    return () => { cancelled = true; };
  }, [categorySlug]);

  const heroImages = useMemo(() => {
    const fallbacks = getFallbackImages(categorySlug);
    return fallbacks.map((name, i) => ({
      id: i + 1,
      image: loadImage(name),
      alt: `${category?.name || categorySlug} - Slide ${i + 1}`,
    })).filter(s => s.image);
  }, [category, categorySlug]);

  const mappedProducts = useMemo(() => {
    return products.map(p => {
      const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(img => typeof img === 'string' ? img : img?.url || '').filter(Boolean)
        : [p.image, p.hoverImage, p.thumbnail].filter(Boolean);
      return {
        id: p.id,
        title: p.name,
        image: images[0] || '',
        hoverImage: images[1] || images[0] || '',
        price: Number(p.price || p.salePrice || 0),
        originalPrice: Number(p.originalPrice || p.compareAtPrice || p.mrp || 0),
        rating: p.rating || 5,
        reviews: p.reviews || 0,
        colorsText: '',
      };
    });
  }, [products]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-gray-400 text-lg animate-pulse">Loading category...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-red-600">{error}</h1>
          <Link to="/" className="mt-6 inline-block bg-black text-white px-6 py-3 font-semibold rounded-md hover:bg-gray-800 transition">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {heroImages.length > 0 && (
        <section className="w-full overflow-hidden bg-gray-50">
          <Swiper
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            speed={800}
            loop={true}
            modules={[Pagination, Autoplay]}
            className="hero-swiper"
          >
            {heroImages.map((slide) => (
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
      )}

      <header className="pt-12 pb-8 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {category?.name || categorySlug?.charAt(0).toUpperCase() + categorySlug?.slice(1)} Collection
        </h1>
        {category?.description && (
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
            {category.description}
          </p>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        {mappedProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found in this category.</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
            {mappedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CategoryTemplate;
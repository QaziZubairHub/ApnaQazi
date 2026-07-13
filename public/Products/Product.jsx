import { useState } from "react";

const Product = () => {
  const [products] = useState([
    { title: 'TRANSITIONS', label: 'Transitions', name: 'Ray-Ban Meta Smart', description: 'AI glasses with transition lenses, stylish everyday wear.', price: 3500, discount: 15, rating: 4.5, reviews: 128, image: '/Products/a.png' },
    { title: 'RAY-BAN META', label: 'Ray-Ban Meta', name: 'Wayfarer Classic', description: 'Timeless frame, photochromic lens technology built-in.', price: 3500, discount: 15, rating: 4.3, reviews: 94, image: '/Products/b.png' },
    { title: 'TRANSITIONS', label: 'Transitions', name: 'Oval Gradient Frame', description: 'Light-adaptive oval frames perfect for daily transitions.', price: 3500, discount: 15, rating: 4.7, reviews: 210, image: '/Products/c.png' },
    { title: 'AI GLASSES', label: 'AI Glasses', name: 'Meta Smart Connect', description: 'Hear, call and capture with premium AI-powered frames.', price: 3500, discount: 15, rating: 4.6, reviews: 175, image: '/Products/d.png' },
    { title: 'SUNGLASSES', label: 'Sunglasses', name: 'Clubmaster Bold', description: 'Iconic browline design, UV400 polarized protection.', price: 3500, discount: 15, rating: 4.2, reviews: 63, image: '/Products/e.png' },
    { title: 'TRANSITIONS', label: 'Transitions', name: 'Round Lens Edition', description: 'Retro-inspired round frames with smart light control.', price: 3500, discount: 15, rating: 4.4, reviews: 88, image: '/Products/f.png' },
    { title: 'RAY-BAN META', label: 'Ray-Ban Meta', name: 'Aviator Heritage', description: 'Classic aviator silhouette meets modern AI technology.', price: 3500, discount: 15, rating: 4.8, reviews: 302, image: '/Products/g.png' },
    { title: 'SUNGLASSES', label: 'Sunglasses', name: 'Square Shield', description: 'Bold square frame with polarized mirror lens finish.', price: 3500, discount: 15, rating: 4.1, reviews: 47, image: '/Products/h.png' },
    { title: 'AI GLASSES', label: 'AI Glasses', name: 'Slim Navigator', description: 'Minimal navigator frame with voice assistant ready.', price: 3500, discount: 15, rating: 4.5, reviews: 139, image: '/Products/i.png' },
    { title: 'TRANSITIONS', label: 'Transitions', name: 'Cat-Eye Premium', description: 'Chic cat-eye silhouette with transition photo lenses.', price: 3500, discount: 15, rating: 4.6, reviews: 196, image: '/Products/j.png' },
  ]);

  const [liked, setLiked] = useState(new Set());
  const [added, setAdded] = useState(new Set());
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Sunglasses', 'AI Glasses', 'Transitions'];

  const filteredProducts = activeTab === 'All'
    ? products
    : products.filter(p => p.label === activeTab);

  const toggleWish = (index) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleCart = (index) => {
    setAdded(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map(i => {
      if (rating >= i) return '★';
      if (rating >= i - 0.5) return '½';
      return '☆';
    }).join('');
  };

  return (
    <div className="w-full p-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-lg font-medium text-gray-900">
          Eyewear Collection
          <span className="text-sm font-normal text-gray-400 ml-2">{filteredProducts.length} items</span>
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gray-100 text-gray-900 border-gray-300'
                  : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProducts.map((item, index) => {
          const finalPrice = Math.round(item.price - (item.price * item.discount) / 100);
          const isLiked = liked.has(index);
          const isAdded = added.has(index);

          return (
            <div
              key={index}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:border-gray-200 hover:-translate-y-1"
            >
              {/* Image Section */}
              <div className="relative bg-gray-50 overflow-hidden" style={{ aspectRatio: '1 / 0.85' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                />

                {/* Discount Badge */}
                <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {item.discount}% OFF
                </span>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWish(index); }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 bg-white ${
                    isLiked ? 'border-red-400 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col flex-grow gap-1.5">

                {/* Category Label */}
                <span className="text-[10px] font-semibold tracking-widest text-[#534AB7] uppercase">
                  {item.label}
                </span>

                {/* Product Name */}
                <p className="text-[13px] font-medium text-gray-900 leading-snug">
                  {item.name}
                </p>

                {/* Description */}
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-yellow-500">{renderStars(item.rating)}</span>
                  <span className="text-[10px] text-gray-400">{item.rating} ({item.reviews})</span>
                </div>

                {/* Price Row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[15px] font-semibold text-[#534AB7]">
                      Rs {finalPrice.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400 line-through">
                      Rs {item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCart(index); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isAdded
                        ? 'bg-green-600 text-white'
                        : 'bg-[#534AB7] text-white hover:bg-[#3C3489]'
                    }`}
                    aria-label="Add to cart"
                  >
                    {isAdded ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Product;

import { useState } from "react";

const Product = () => {
  const [product] = useState([
    {
      title: 'TRANSITIONS',
      label: 'Transitions',
      name: 'Ray-Ban Meta Smart',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.5,
      reviews: 128,
      image: '/Products/a.png'
    },
    {
      title: 'RAY-BAN META',
      label: 'Ray-Ban Meta',
      name: 'Wayfarer Classic',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.3,
      reviews: 94,
      image: '/Products/b.png'
    },
    {
      title: 'TRANSITIONS',
      label: 'Transitions',
      name: 'Oval Gradient Frame',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.7,
      reviews: 210,
      image: '/Products/c.png'
    },
    {
      title: 'AI GLASSES',
      label: 'AI Glasses',
      name: 'Meta Smart Connect',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.6,
      reviews: 175,
      image: '/Products/d.png'
    },
    {
      title: 'SUNGLASSES',
      label: 'Sunglasses',
      name: 'Clubmaster Bold',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.2,
      reviews: 63,
      image: '/Products/e.png'
    },
    {
      title: 'TRANSITIONS',
      label: 'Transitions',
      name: 'Round Lens Edition',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.4,
      reviews: 88,
      image: '/Products/f.png'
    },
    {
      title: 'RAY-BAN META',
      label: 'Ray-Ban Meta',
      name: 'Aviator Heritage',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.8,
      reviews: 302,
      image: '/Products/g.png'
    },
    {
      title: 'SUNGLASSES',
      label: 'Sunglasses',
      name: 'Square Shield',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.1,
      reviews: 47,
      image: '/Products/h.png'
    },
    {
      title: 'AI GLASSES',
      label: 'AI Glasses',
      name: 'Slim Navigator',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.5,
      reviews: 139,
      image: '/Products/i.png'
    },
    {
      title: 'TRANSITIONS',
      label: 'Transitions',
      name: 'Cat-Eye Premium',
      descripiton: 'The new Ray-Ban Meta. Discover a stylish, colorful range of AI glasses',
      price: '3500',
      discount: '15',
      rating: 4.6,
      reviews: 196,
      image: '/Products/j.png'
    }
  ]);

  const [liked, setLiked] = useState(new Set());
  const [added, setAdded] = useState(new Set());
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Sunglasses', 'AI Glasses', 'Transitions'];

  const filteredProducts = activeTab === 'All'
    ? product
    : product.filter(p => p.label === activeTab);

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
    <div className="w-full p-2">

      {/* Header + Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
          Eyewear Collection
          <span className="text-sm font-normal text-gray-400 ml-2">{filteredProducts.length} items</span>
        </h1>

        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gray-100 text-gray-900 border-gray-300 font-medium'
                  : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((item, index) => {
          const finalPrice = Math.round(item.price - (item.price * item.discount) / 100);
          const isLiked = liked.has(index);
          const isAdded = added.has(index);

          return (
            <div
              key={index}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer border border-gray-100"
            >

              {/* Image Section */}
              <div className="relative h-48 w-full bg-[#f8f9fa] flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 ease-out"
                />

                {/* Discount Badge */}
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                  {item.discount}% OFF
                </span>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWish(index); }}
                  className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center border bg-white transition-all duration-200 ${
                    isLiked
                      ? 'border-red-400 text-red-500'
                      : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
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

              {/* Content Section */}
              <div className="p-4 flex flex-col flex-grow">

                {/* Category Label */}
                <span className="text-[10px] font-semibold tracking-widest text-[#5039f7] uppercase mb-1">
                  {item.title}
                </span>

                {/* Product Name */}
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">
                  {item.name}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-[13px] leading-snug mb-2 line-clamp-2">
                  {item.descripiton}
                </p>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[12px] text-yellow-500">{renderStars(item.rating)}</span>
                  <span className="text-[11px] text-gray-400">{item.rating} ({item.reviews})</span>
                </div>

                {/* Price + Cart Button */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-[#5039f7]">Rs {finalPrice.toLocaleString()}</span>
                    <del className="text-[13px] text-gray-400 font-medium">Rs {Number(item.price).toLocaleString()}</del>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCart(index); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isAdded
                        ? 'bg-green-600 text-white'
                        : 'bg-[#5039f7] text-white hover:bg-[#3d2cd4]'
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

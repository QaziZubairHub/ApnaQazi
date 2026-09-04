import { Link, useNavigate } from 'react-router-dom';

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

export { ProductCard, StarRating };

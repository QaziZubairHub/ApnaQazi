const getFirstImage = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
  }
  return "";
};

const truncate = (s, max) => s && s.length > max ? s.slice(0, max) + "…" : s || "";

export const generateMetaTags = (product) => {
  const name = product.name || "";
  const slug = product.slug || "";
  const metaTitle = product.seo?.metaTitle || name;
  const metaDescription = product.seo?.metaDescription || product.shortDescription || name;
  const ogImage = product.seo?.ogImage || getFirstImage(product);

  return {
    canonicalUrl: `${window.location.origin}/product/${slug}`,
    openGraphTitle: metaTitle,
    openGraphDescription: truncate(metaDescription, 200),
    twitterCardTitle: metaTitle,
    twitterCardDescription: truncate(metaDescription, 200),
    twitterCardImage: ogImage,
  };
};

export const generateJsonLd = (product) => {
  const name = product.name || "";
  const slug = product.slug || "";
  const price = Number(product.price) || 0;
  const compareAtPrice = Number(product.compareAtPrice) || 0;
  const sku = product.sku || "";
  const description = (product.shortDescription || product.description || "").slice(0, 500);
  const image = getFirstImage(product);

  const offer = {
    "@type": "Offer",
    price,
    priceCurrency: "PKR",
    url: `${window.location.origin}/product/${slug}`,
    itemCondition: "https://schema.org/NewCondition",
    availability: product.stockQuantity > 0
      ? "https://schema.org/InStock"
      : product.allowBackorders
        ? "https://schema.org/PreOrder"
        : "https://schema.org/OutOfStock",
  };

  if (sku) offer.sku = sku;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    offers: compareAtPrice > price
      ? { "@type": "AggregateOffer", lowPrice: price, highPrice: compareAtPrice, priceCurrency: "PKR", offers: [offer] }
      : offer,
  };

  if (sku) jsonLd.sku = sku;
  const brandName = product.brandName || product._brandName || "";
  const categoryName = product.categoryName || product._categoryName || "";
  if (brandName) jsonLd.brand = { "@type": "Brand", name: brandName };
  if (categoryName) jsonLd.category = categoryName;

  return jsonLd;
};

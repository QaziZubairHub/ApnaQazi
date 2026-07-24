import { useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import Belt from './Belt';
import Grocery from './Grocery';

// Dynamic category route handler.
// Navigation-only fix: keep existing UI/layout by delegating to existing category components when available.
// If a dedicated category page component doesn't exist yet, we fall back to the existing Belts page UI.
const CategoryPage = () => {
  const { categorySlug } = useParams();

  // Normalize to lowercase to guarantee casing consistency everywhere.
  const slug = (categorySlug || '').toLowerCase();

  // Map known category slugs to existing components.
  // Currently the project has only Belt.jsx implemented.
  // This file ensures correct routing/navigation for all future categories.
  if (slug === 'belts' || slug === 'belt') {
    return <Belt />;
  }

  if (slug === 'grocery' || slug === 'grocery-products') {
    return <Grocery />;
  }

  // Fallback: reuse existing category UI until other category pages are implemented.
  return (
    <Layout>
      {/* Keep the same minimal navigation-only behavior; no UI changes required here. */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{slug.charAt(0).toUpperCase() + slug.slice(1)}</h1>
        <p className="mt-4 text-gray-600">Category page is routed correctly.</p>
        <Link to="/belts" className="mt-6 inline-block bg-black text-white px-6 py-3 font-semibold rounded-md hover:bg-gray-800 transition">
          Back to Belts
        </Link>
      </div>
    </Layout>
  );
};

export default CategoryPage;


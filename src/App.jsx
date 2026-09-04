import 'remixicon/fonts/remixicon.css'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import NotFound from './features/admin/NotFound'
import ProductsPage from './features/products/pages/ProductsPage'
import Layout from './features/admin/Layout'
import Order from './features/admin/Orders'
import Dashboard from './features/admin/Dashboard'
import Customers from './features/admin/Customers'
import Payment from './features/admin/Payment'
import Analytics from './features/admin/Analytics'
import CreateInvoice from './features/admin/CreateInvoice'
import Coupons from './features/admin/Coupons'
import ProtectedRoute from './features/admin/ProtectedRoute'
import LoginRegister from './features/admin/Login_Register'
import Preloader from './components/Preloader'
import CategoryPage from './components/CategoryPage'
import SettingsLayout from './features/admin/settings/components/SettingsLayout'
import General from './features/admin/settings/pages/General'
import Store from './features/admin/settings/pages/Store'
import PaymentSettings from './features/admin/settings/pages/Payment'
import Shipping from './features/admin/settings/pages/Shipping'
import Email from './features/admin/settings/pages/Email'
import WhatsApp from './features/admin/settings/pages/WhatsApp'
import Firebase from './features/admin/settings/pages/Firebase'
import Notifications from './features/admin/settings/pages/Notifications'
import Invoice from './features/admin/settings/pages/Invoice'
import SEO from './features/admin/settings/pages/SEO'
import Appearance from './features/admin/settings/pages/Appearance'
import Security from './features/admin/settings/pages/Security'
import UsersRoles from './features/admin/settings/pages/UsersRoles'
import AnalyticsSettings from './features/admin/settings/pages/Analytics'
import BackupRestore from './features/admin/settings/pages/BackupRestore'
import APISettings from './features/admin/settings/pages/API'
import ActivityLogs from './features/admin/settings/pages/ActivityLogs'
import SystemHealth from './features/admin/settings/pages/SystemHealth'
import Developer from './features/admin/settings/pages/Developer'
import SettingsIndex from './features/admin/settings/pages/index'
import OrganizationManager from './features/admin/OrganizationManager'


const Home = lazy(() => import('./components/Home'))


const Contact = lazy(() => import('./components/ContactPage'))

const Cart = lazy(() => import('./components/Cart'))

const Checkout = lazy(() => import('./components/Checkout'))
const BeltProductPage = lazy(() => import('./components/ProductDetailPage'))
const ProductCreate = lazy(() => import('./features/admin/ProductUpsert').then(m => ({ default: m.ProductCreate })))
const ProductEdit = lazy(() => import('./features/admin/ProductUpsert').then(m => ({ default: m.ProductEdit })))

const AdminLoginRoute = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <LoginRegister isOpen onClose={() => navigate("/", { replace: true })} />
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Preloader />
        <Toaster

          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '14px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
            },
          }}
        />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-slate-600">Loading...</div>}>
          <Routes>
            {/* Storefront Routes */}
            <Route path="/" element={<Home />} />
            
            <Route path="/Contact us" element={<Contact />} />
            <Route path="/Cart" element={<Cart />} />
            <Route path="/cart" element={<Navigate to="/Cart" replace />} />
            <Route path="/Checkout" element={<Checkout />} />

            {/* Category routing (dynamic): /:categorySlug */}
            <Route path="/:categorySlug" element={<CategoryPage />} />

            {/* Back-compat product/category routes */}
            <Route path="/Beltproductpage" element={<BeltProductPage />} />
            <Route path="/Beltproductpage/:id" element={<BeltProductPage />} />
            <Route path="/product/:id" element={<BeltProductPage />} />

            {/* Admin auth and redirect routes */}
            <Route path="/admin/login" element={<AdminLoginRoute />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Protected admin routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="product" element={<Navigate to="/admin/products" replace />} />
                <Route path="product/create" element={<ProductCreate />} />
                <Route path="product/:id/edit" element={<ProductEdit />} />
                <Route path="order" element={<Order />} />
                <Route path="customers" element={<Customers />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="organization/:collection" element={<OrganizationManager />} />
                <Route path="payment" element={<Payment />} />
                <Route path="invoices/create" element={<CreateInvoice />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="settings" element={<SettingsLayout />}>
                  <Route index element={<SettingsIndex />} />
                  <Route path="general" element={<General />} />
                  <Route path="store" element={<Store />} />
                  <Route path="payment" element={<PaymentSettings />} />
                  <Route path="shipping" element={<Shipping />} />
                  <Route path="email" element={<Email />} />
                  <Route path="whatsapp" element={<WhatsApp />} />
                  <Route path="firebase" element={<Firebase />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="invoice" element={<Invoice />} />
                  <Route path="seo" element={<SEO />} />
                  <Route path="appearance" element={<Appearance />} />
                  <Route path="security" element={<Security />} />
                  <Route path="users-roles" element={<UsersRoles />} />
                  <Route path="analytics" element={<AnalyticsSettings />} />
                  <Route path="backup-restore" element={<BackupRestore />} />
                  <Route path="api" element={<APISettings />} />
                  <Route path="activity-logs" element={<ActivityLogs />} />
                  <Route path="system-health" element={<SystemHealth />} />
                  <Route path="developer" element={<Developer />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

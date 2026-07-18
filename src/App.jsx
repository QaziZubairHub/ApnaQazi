import 'remixicon/fonts/remixicon.css'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import NotFound from './components/Admin/NotFound'
import Product from './components/Admin/Product'
import Layout from './components/Admin/Layout'
import Order from './components/Admin/Orders'
import Dashboard from './components/Admin/Dashboard'
import Customers from './components/Admin/Customers'
import Payment from './components/Admin/Payment'
import Analytics from './components/Admin/Analytics'
import CreateInvoice from './components/Admin/CreateInvoice'
import Coupons from './components/Admin/Coupons'
import ProtectedRoute from './components/Admin/ProtectedRoute'
import LoginRegister from './components/Admin/Login_Register'
import Preloader from './components/Preloader'
import CategoryPage from './components/CategoryPage'
import SettingsLayout from './components/settings/SettingsLayout'
import General from './pages/Admin/Settings/General'
import Store from './pages/Admin/Settings/Store'
import PaymentSettings from './pages/Admin/Settings/Payment'
import Shipping from './pages/Admin/Settings/Shipping'
import Email from './pages/Admin/Settings/Email'
import WhatsApp from './pages/Admin/Settings/WhatsApp'
import Firebase from './pages/Admin/Settings/Firebase'
import Notifications from './pages/Admin/Settings/Notifications'
import Invoice from './pages/Admin/Settings/Invoice'
import SEO from './pages/Admin/Settings/SEO'
import Appearance from './pages/Admin/Settings/Appearance'
import Security from './pages/Admin/Settings/Security'
import UsersRoles from './pages/Admin/Settings/UsersRoles'
import AnalyticsSettings from './pages/Admin/Settings/Analytics'
import BackupRestore from './pages/Admin/Settings/BackupRestore'
import APISettings from './pages/Admin/Settings/API'
import ActivityLogs from './pages/Admin/Settings/ActivityLogs'
import SystemHealth from './pages/Admin/Settings/SystemHealth'
import Developer from './pages/Admin/Settings/Developer'
import SettingsIndex from './pages/Admin/Settings/index'


const Home = lazy(() => import('./components/Home'))

const Contact = lazy(() => import('./components/Contact us'))

const Cart = lazy(() => import('./components/Cart'))

const Checkout = lazy(() => import('./components/Checkout'))
const BeltProductPage = lazy(() => import('./components/Beltproductpage'))

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
                <Route path="product" element={<Product />} />
                <Route path="products" element={<Product />} />
                <Route path="product/create" element={lazy(() => import('./components/Admin/ProductUpsert.jsx').then(m => ({ default: m.ProductCreate })))} />
                <Route path="product/:id/edit" element={lazy(() => import('./components/Admin/ProductUpsert.jsx').then(m => ({ default: m.ProductEdit })))} />
                <Route path="order" element={<Order />} />
                <Route path="customers" element={<Customers />} />
                <Route path="analytics" element={<Analytics />} />
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

import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/store'
import { PublicLayout, RequireAuth, AdminLayout } from './components/Layouts'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import CategoriesPage from './pages/Categories'
import About from './pages/About'
import Contact from './pages/Contact'
import Legal from './pages/Legal'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import Addresses from './pages/Addresses'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/CategoriesPage'
import AdminOrders from './pages/admin/Orders'
import AdminInventory from './pages/admin/Inventory'
import AdminPrescriptions from './pages/admin/Prescriptions'
import AdminCustomers from './pages/admin/Customers'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, search])
  return null
}

const staffRoles = ['admin', 'staff', 'pharmacist'] as const

export default function App() {
  const hydrate = useAuth((s) => s.hydrate)
  const hydratedOnce = useRef(false)

  useEffect(() => {
    if (hydratedOnce.current) return
    hydratedOnce.current = true
    void hydrate()
  }, [hydrate])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Legal kind="privacy" />} />
          <Route path="terms" element={<Legal kind="terms" />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />

          <Route element={<RequireAuth />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success/:id" element={<OrderSuccess />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth roles={[...staffRoles]}>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="prescriptions" element={<AdminPrescriptions />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route
            path="reports"
            element={
              <RequireAuth roles={['admin']}>
                <AdminReports />
              </RequireAuth>
            }
          />
          <Route
            path="settings"
            element={
              <RequireAuth roles={['admin']}>
                <AdminSettings />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </>
  )
}

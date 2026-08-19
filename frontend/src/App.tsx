import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Home from './pages/Home'
import ShopManage from './pages/ShopManage'
import ShopOrders from './pages/ShopOrders'
import ShopDetail from './pages/ShopDetail'
import Wallet from './pages/Wallet'
import MyOrders from './pages/MyOrders'
import OrderConfirm from './pages/OrderConfirm'

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop/manage"
          element={
            <ProtectedRoute>
              <ShopManage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop/orders"
          element={
            <ProtectedRoute>
              <ShopOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop/:id"
          element={
            <ProtectedRoute>
              <ShopDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-confirm"
          element={
            <ProtectedRoute>
              <OrderConfirm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
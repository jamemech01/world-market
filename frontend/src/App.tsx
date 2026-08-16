import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Home from './pages/Home'
import ShopManage from './pages/ShopManage'
import ShopOrders from './pages/ShopOrders'
import ShopDetail from './pages/ShopDetail'
import Wallet from './pages/Wallet'
import MyOrders from './pages/MyOrders'
import OrderConfirm from './pages/OrderConfirm'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/shop/manage"
          element={<ShopManage />}
        />

        <Route
          path="/shop/orders"
          element={<ShopOrders />}
        />

        <Route
          path="/shop/:id"
          element={<ShopDetail />}
        />

        <Route
          path="/wallet"
          element={<Wallet />}
        />

        <Route
          path="/order-confirm"
          element={<OrderConfirm />}
        />

        <Route
          path="/orders"
          element={<MyOrders />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
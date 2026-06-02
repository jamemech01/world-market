import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Market from './pages/Market'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/market" element={
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
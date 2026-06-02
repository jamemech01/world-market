import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ShoppingCart, MessageSquare, LogOut } from 'lucide-react'

export default function Market() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    window.location.href = '/login'
  }

  return (
    <div className="relative w-screen h-screen">
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
      </MapContainer>

      {/* Logout */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={handleLogout}
          className="bg-white shadow rounded-full w-10 h-10 flex items-center justify-center"
        >
          <LogOut size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Inbox + Vending */}
      <div className="absolute bottom-8 right-4 flex flex-col gap-3 z-[1000]">
        <button className="bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center">
          <MessageSquare size={24} className="text-gray-700" />
        </button>
        <button className="bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center">
          <ShoppingCart size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  )
}
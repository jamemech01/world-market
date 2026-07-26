import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { LogOut } from 'lucide-react'

import 'leaflet/dist/leaflet.css'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative w-full h-dvh">
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={13}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      </MapContainer>

      <button
        type="button"
        aria-label="Logout"
        className="absolute top-4 right-4 z-[1000] border rounded-lg p-3 bg-white transition-transform duration-150 active:scale-95"
        onClick={handleLogout}
      >
        <LogOut size={20} />
      </button>
    </div>
  )
}
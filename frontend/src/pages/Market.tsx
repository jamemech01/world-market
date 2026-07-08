import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ShoppingCart, MessageSquare, LogOut, MapPin } from 'lucide-react'
import L from 'leaflet'

// fix default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface Pin {
  lat: number
  lng: number
  address: string
}

function PinPlacer({ placing, onPlace }: { placing: boolean; onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (placing) onPlace(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function Market() {
  const [placing, setPlacing] = useState(false)
  const [pins, setPins] = useState<Pin[]>([])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    window.location.href = '/login'
  }

  const handlePlace = async (lat: number, lng: number) => {
    setPlacing(false)
    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      if (data.display_name) address = data.display_name
    } catch {}
    setPins(prev => [...prev, { lat, lng, address }])
  }

  return (
    <div className="relative w-screen h-screen">
      {placing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-full shadow text-sm text-gray-600">
          Tap on the map to place your shop
        </div>
      )}

      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        style={{ cursor: placing ? 'crosshair' : 'grab' }}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <PinPlacer placing={placing} onPlace={handlePlace} />
        {pins.map((pin, i) => (
          <Marker key={i} position={[pin.lat, pin.lng]}>
            <Popup>
              <div className="text-sm max-w-[200px]">
                <p className="font-semibold mb-1">My Shop</p>
                <p className="text-gray-500">{pin.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Logout */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button onClick={handleLogout} className="bg-white shadow rounded-full w-10 h-10 flex items-center justify-center">
          <LogOut size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Buttons */}
      <div className="absolute bottom-8 right-4 flex flex-col gap-3 z-[1000]">
        <button className="bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center">
          <MessageSquare size={24} className="text-gray-700" />
        </button>
        <button
          onClick={() => setPlacing(p => !p)}
          className={`shadow-lg rounded-full w-14 h-14 flex items-center justify-center ${placing ? 'bg-blue-500' : 'bg-white'}`}
        >
          <MapPin size={24} className={placing ? 'text-white' : 'text-gray-700'} />
        </button>
        <button className="bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center">
          <ShoppingCart size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  )
}
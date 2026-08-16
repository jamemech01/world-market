import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { createOrder, getOrderQuote } from '../services/order'
import 'leaflet/dist/leaflet.css'

function MapClickHandler({ enabled, onClick }: { enabled: boolean; onClick: (lat: number, lng: number) => void }) {
  const map = useMap()
  useEffect(() => {
    map.getContainer().style.cursor = enabled ? 'crosshair' : ''
    return () => { map.getContainer().style.cursor = '' }
  }, [enabled, map])
  useMapEvents({ click: (e) => enabled && onClick(e.latlng.lat, e.latlng.lng) })
  return null
}

type CartData = {
  shopId: number
  shopLat: number
  shopLng: number
  items: { productId: number; quantity: number }[]
  totalPrice: number
  totalItems: number
}

export default function OrderConfirm() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartData | null>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [quote, setQuote] = useState<{ distanceKm: number; deliveryFee: number } | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('order_confirm')
    if (!raw) {
      navigate('/', { replace: true })
      return
    }
    setCart(JSON.parse(raw))
  }, [navigate])

  const handleSelectLocation = async (lat: number, lng: number) => {
    if (!cart) return
    setPin({ lat, lng })
    setQuote(null)
    setError('')
    setQuoting(true)
    try {
      const result = await getOrderQuote({ shopId: cart.shopId, deliveryLat: lat, deliveryLng: lng })
      setQuote(result)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not calculate delivery fee')
    } finally {
      setQuoting(false)
    }
  }

  const handleConfirm = async () => {
    if (!cart || !pin || !quote) return
    setSubmitting(true)
    setError('')
    try {
      await createOrder({ shopId: cart.shopId, items: cart.items, deliveryLat: pin.lat, deliveryLng: pin.lng })
      sessionStorage.removeItem('order_confirm')
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (!cart) return null

  const total = cart.totalPrice + (quote?.deliveryFee || 0)

  return (
    <div className="relative w-full h-dvh">
      <MapContainer center={[cart.shopLat, cart.shopLng]} zoom={14} zoomControl={false} className="relative z-0 w-full h-full">
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png" />
        <MapClickHandler enabled={!submitting} onClick={handleSelectLocation} />
        <Marker position={[cart.shopLat, cart.shopLng]} />
        {pin && <Marker position={[pin.lat, pin.lng]} />}
      </MapContainer>

      <button
        type="button"
        className="absolute top-4 left-4 border bg-white px-4 py-2 text-sm"
        onClick={() => { sessionStorage.removeItem('order_confirm'); navigate(-1) }}
      >
        Back
      </button>

      {!pin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 border bg-white px-4 py-2 text-sm">
          Tap the map to select delivery location
        </div>
      )}

      {quoting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 border bg-white px-4 py-2 text-sm">
          Calculating delivery fee...
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-sm mb-2">{error}</p>}

          {quote && (
            <div className="text-sm mb-2">
              <div className="flex justify-between"><span>Products</span><span>${cart.totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery ({quote.distanceKm.toFixed(1)}km)</span><span>${quote.deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between font-medium"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          )}

          <button
            type="button"
            disabled={!pin || !quote || submitting || quoting}
            className="w-full border py-3 disabled:opacity-50"
            onClick={handleConfirm}
          >
            {submitting ? 'Placing order...' : quote ? `Confirm · $${total.toFixed(2)}` : 'Select delivery location'}
          </button>
        </div>
      </div>
    </div>
  )
}
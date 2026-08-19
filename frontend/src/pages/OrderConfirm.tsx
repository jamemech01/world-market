import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { createOrder, getOrderQuote } from '../services/order'
import 'leaflet/dist/leaflet.css'

function MapResizeFix() {
  const map = useMap()

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0)

    return () => clearTimeout(t)
  }, [map])

  return null
}

function MapClickHandler({
  enabled,
  onClick,
}: {
  enabled: boolean
  onClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    map.getContainer().style.cursor = enabled
      ? 'crosshair'
      : ''

    return () => {
      map.getContainer().style.cursor = ''
    }
  }, [enabled, map])

  useMapEvents({
    click: (e) =>
      enabled &&
      onClick(e.latlng.lat, e.latlng.lng),
  })

  return null
}

type CartData = {
  shopId: number
  shopLat: number
  shopLng: number
  items: {
    productId: number
    quantity: number
  }[]
  totalPrice: number
  totalItems: number
}

type Quote = {
  distanceKm: number
  deliveryFee: number
}

export default function OrderConfirm() {
  const navigate = useNavigate()

  const [cart, setCart] =
    useState<CartData | null>(null)

  const [pin, setPin] =
    useState<{
      lat: number
      lng: number
    } | null>(null)

  const [quote, setQuote] =
    useState<Quote | null>(null)

  const [quoting, setQuoting] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const raw =
      sessionStorage.getItem('order_confirm')

    if (!raw) {
      navigate('/', { replace: true })
      return
    }

    setCart(JSON.parse(raw))
  }, [navigate])

  const handleSelectLocation = async (
    lat: number,
    lng: number,
  ) => {
    if (!cart || submitting) return

    setPin({ lat, lng })
    setQuote(null)
    setError('')
    setQuoting(true)

    try {
      const result = await getOrderQuote({
        shopId: cart.shopId,
        deliveryLat: lat,
        deliveryLng: lng,
      })

      setQuote(result)
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          'Could not calculate delivery fee',
      )
    } finally {
      setQuoting(false)
    }
  }

  const handleConfirm = async () => {
    if (!cart || !pin || !quote || submitting) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await createOrder({
        shopId: cart.shopId,
        items: cart.items,
        deliveryLat: pin.lat,
        deliveryLng: pin.lng,
      })

      sessionStorage.removeItem('order_confirm')
      navigate('/')
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          'Could not place order',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    sessionStorage.removeItem('order_confirm')
    navigate(-1)
  }

  if (!cart) return null

  const total =
    cart.totalPrice +
    (quote?.deliveryFee || 0)

  return (
    <div className="relative w-full h-dvh">
      <MapContainer
        center={[
          cart.shopLat,
          cart.shopLng,
        ]}
        zoom={14}
        zoomControl={false}
        className="relative z-0 w-full h-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />

        <MapResizeFix />

        <MapClickHandler
          enabled={!submitting && !quoting}
          onClick={handleSelectLocation}
        />

        <Marker
          position={[
            cart.shopLat,
            cart.shopLng,
          ]}
        />

        {pin && (
          <Marker
            position={[
              pin.lat,
              pin.lng,
            ]}
          />
        )}
      </MapContainer>

      <button
        type="button"
        className="absolute top-4 left-4 z-10 border bg-white px-4 py-3 text-base font-medium"
        onClick={handleBack}
        disabled={submitting}
      >
        Back
      </button>

      {!pin && !submitting && (
        <div className="fixed bottom-28 left-1/2 z-10 -translate-x-1/2 border bg-white px-5 py-3 text-sm whitespace-nowrap">
          Tap the map to select delivery location
        </div>
      )}

      {quoting && (
        <div className="fixed bottom-28 left-1/2 z-10 -translate-x-1/2 border bg-white px-5 py-3 text-sm whitespace-nowrap">
          Calculating delivery fee...
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white p-4">
        <div className="mx-auto max-w-2xl">
          {error && (
            <p className="mb-3 text-sm">
              {error}
            </p>
          )}

          {quote && (
            <div className="mb-3 text-sm">
              <div className="flex justify-between">
                <span>Products</span>
                <span>
                  ${cart.totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Delivery (
                  {quote.distanceKm.toFixed(1)}
                  km)
                </span>
                <span>
                  ${quote.deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="mt-1 flex justify-between text-base font-medium">
                <span>Total</span>
                <span>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={
              !pin ||
              !quote ||
              submitting ||
              quoting
            }
            className="w-full border bg-white py-4 text-lg font-medium disabled:opacity-50"
            onClick={handleConfirm}
          >
            {submitting
              ? 'Placing order...'
              : quote
                ? `Confirm · $${total.toFixed(2)}`
                : 'Select delivery location'}
          </button>
        </div>
      </div>
    </div>
  )
}
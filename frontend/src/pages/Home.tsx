import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
  Tooltip,
} from 'react-leaflet'
import CreateShopForm from '../components/shop/CreateShopForm'
import ConfirmDialog from '../components/ConfirmDialog'
import WalletSummary from '../components/WalletSummary'
import { useAuth } from '../hooks/useAuth'
import { getMe } from '../services/user'
import { getShops, getMyShop, openShop } from '../services/shop'
import { getMyOrders, getShopOrders } from '../services/order'
import 'leaflet/dist/leaflet.css'

type Shop = {
  id: number
  name: string
  lat: number
  lng: number
}

const shopIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

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

function CenterMyShop({
  myShop,
  trigger,
}: {
  myShop: Shop | null
  trigger: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (trigger && myShop) {
      map.flyTo(
        [myShop.lat, myShop.lng],
        13,
        {
          duration: 1,
        },
      )
    }
  }, [trigger, myShop, map])

  return null
}

function SaveMapView() {
  const map = useMap()

  useEffect(() => {
    const save = () => {
      const center = map.getCenter()

      sessionStorage.setItem(
        'home_map_view',
        JSON.stringify({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        }),
      )
    }

    map.on('moveend', save)
    map.on('zoomend', save)

    return () => {
      map.off('moveend', save)
      map.off('zoomend', save)
    }
  }, [map])

  return null
}

export default function Home() {
  useAuth()
  const navigate = useNavigate()

  const [isPlacingPin, setIsPlacingPin] =
    useState(false)

  const [pinPosition, setPinPosition] =
    useState<{
      lat: number
      lng: number
    } | null>(null)

  const [showCreateShop, setShowCreateShop] =
    useState(false)

  const [showOpenShop, setShowOpenShop] =
    useState(false)

  const [openShopCode, setOpenShopCode] =
    useState('')

  const [openShopError, setOpenShopError] =
    useState('')

  const [openingShop, setOpeningShop] =
    useState(false)

  const [logoutOpen, setLogoutOpen] =
    useState(false)

  const [canOpenShop, setCanOpenShop] =
    useState(false)

  const [myShop, setMyShop] =
    useState<Shop | null>(null)

  const [centerMyShop, setCenterMyShop] =
    useState(false)

  const [shops, setShops] =
    useState<Shop[]>([])

  const [myOrderAlert, setMyOrderAlert] =
    useState(false)

  const [shopOrderAlert, setShopOrderAlert] =
    useState(false)

  const hasShop = !!myShop

  const savedMapView =
    sessionStorage.getItem('home_map_view')

  const initialMapView = savedMapView
    ? JSON.parse(savedMapView)
    : {
      lat: 13.7563,
      lng: 100.5018,
      zoom: 13,
    }

  useEffect(() => {
    getMe()
      .then((d) =>
        setCanOpenShop(d.canOpenShop),
      )
      .catch(() => { })

    getShops()
      .then(setShops)
      .catch(() => { })

    getMyShop()
      .then((d) => setMyShop(d || null))
      .catch(() => setMyShop(null))

    getMyOrders()
      .then((orders) => {
        const hasAlert = orders.some(
          (order: any) =>
            order.status === 'delivered',
        )

        setMyOrderAlert(hasAlert)
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (!myShop) {
      setShopOrderAlert(false)
      return
    }

    getShopOrders()
      .then((orders) => {
        const hasAlert = orders.some(
          (order: any) =>
            order.status === 'pending' ||
            order.status === 'accepted',
        )

        setShopOrderAlert(hasAlert)
      })
      .catch(() => { })
  }, [myShop])

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('home_map_view')
    navigate('/login', { replace: true })
  }

  const handleShopButton = () => {
    if (isPlacingPin) {
      setIsPlacingPin(false)
      setPinPosition(null)
      return
    }

    if (hasShop) {
      if (centerMyShop) {
        navigate('/shop/manage')
      } else {
        setCenterMyShop(true)
      }

      return
    }

    if (canOpenShop) {
      setIsPlacingPin(true)
      return
    }

    setOpenShopCode('')
    setOpenShopError('')
    setShowOpenShop(true)
  }

  const handleOpenShop = async () => {
    if (!openShopCode.trim()) {
      setOpenShopError('Enter open shop code')
      return
    }

    setOpeningShop(true)
    setOpenShopError('')

    try {
      await openShop(openShopCode.trim())

      setCanOpenShop(true)
      setShowOpenShop(false)
      setOpenShopCode('')
      setIsPlacingPin(true)
    } catch (e: any) {
      setOpenShopError(
        e.response?.data?.message ||
        'Invalid open shop code',
      )
    } finally {
      setOpeningShop(false)
    }
  }

  return (
    <div className="relative w-full h-dvh">
      <MapContainer
        center={[
          initialMapView.lat,
          initialMapView.lng,
        ]}
        zoom={initialMapView.zoom}
        zoomControl={false}
        className="relative z-0 w-full h-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />

        <MapResizeFix />

        <SaveMapView />

        <CenterMyShop
          myShop={myShop}
          trigger={centerMyShop}
        />

        <MapClickHandler
          enabled={isPlacingPin}
          onClick={(lat, lng) => {
            setPinPosition({ lat, lng })
            setIsPlacingPin(false)
            setShowCreateShop(true)
          }}
        />

        {shops.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={shopIcon}
            eventHandlers={{
              click: () => {
                if (myShop?.id === s.id) {
                  navigate('/shop/manage')
                } else {
                  navigate(`/shop/${s.id}`)
                }
              },
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -10]}
            >
              {s.name}
            </Tooltip>
          </Marker>
        ))}

        {pinPosition && (
          <Marker
            position={[
              pinPosition.lat,
              pinPosition.lng,
            ]}
            icon={shopIcon}
          />
        )}
      </MapContainer>

      {isPlacingPin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 border bg-white px-4 py-2 text-sm">
          Tap the map to place your shop
        </div>
      )}

      {showCreateShop && pinPosition && (
        <CreateShopForm
          lat={pinPosition.lat}
          lng={pinPosition.lng}
          onSuccess={() => {
            setShowCreateShop(false)
            navigate('/shop/manage')
          }}
          onCancel={() => {
            setShowCreateShop(false)
            setPinPosition(null)
          }}
        />
      )}

      {showOpenShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm border bg-white p-4">
            <h2 className="font-medium mb-2">
              Open Shop
            </h2>

            <p className="text-sm mb-3">
              Enter the shop code: shop1234
            </p>

            <input
              autoFocus
              type="password"
              className="w-full border px-3 py-2 mb-2"
              placeholder="Open shop code"
              value={openShopCode}
              onChange={(e) =>
                setOpenShopCode(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleOpenShop()
                }
              }}
            />

            {openShopError && (
              <p className="text-sm mb-2">
                {openShopError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border px-3 py-2"
                onClick={() => {
                  setShowOpenShop(false)
                  setOpenShopCode('')
                  setOpenShopError('')
                }}
                disabled={openingShop}
              >
                Cancel
              </button>

              <button
                type="button"
                className="border px-3 py-2"
                onClick={handleOpenShop}
                disabled={openingShop}
              >
                {openingShop
                  ? 'Checking...'
                  : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {logoutOpen && (
        <ConfirmDialog
          title="Logout"
          message="Logout from this account?"
          onConfirm={handleLogout}
          onCancel={() => setLogoutOpen(false)}
        />
      )}

      <div className="absolute top-4 left-4 z-10">
        <button
          type="button"
          className="border bg-white px-3 py-2"
          onClick={() => setLogoutOpen(true)}
        >
          Logout
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <WalletSummary />

        <button
          type="button"
          className="border bg-white px-3 py-2"
          onClick={() => navigate('/orders')}
        >
          My Orders
          {myOrderAlert ? ' !' : ''}
        </button>

        {hasShop && (
          <button
            type="button"
            className="border bg-white px-3 py-2"
            onClick={() => navigate('/shop/orders')}
          >
            Shop Orders
            {shopOrderAlert ? ' !' : ''}
          </button>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <button
          type="button"
          className="border bg-white px-6 py-5 text-lg font-medium"
          onClick={handleShopButton}
        >
          {hasShop ? 'My Shop' : 'Open Shop'}
        </button>
      </div>
    </div>
  )
}
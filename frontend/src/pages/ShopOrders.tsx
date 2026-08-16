import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../layouts/PageLayout'
import { getMyShop } from '../services/shop'
import {
  getShopOrders,
  acceptOrder,
  rejectOrder,
  deliveredOrder,
} from '../services/order'

type Shop = {
  id: number
  name: string
  lat: number
  lng: number
}

type Order = {
  id: number
  totalAmount: string
  deliveryFee: string
  status: string
  deliveryLat: number
  deliveryLng: number
  createdAt: string
  buyer: { username: string }
  items: {
    id: number
    productName: string
    quantity: number
    price: string
  }[]
}

export default function ShopOrders() {
  const navigate = useNavigate()
  const [shop, setShop] = useState<Shop | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = () => {
    getShopOrders()
      .then((orders) => {
        const sorted = [...orders].sort((a, b) => {
          const statusOrder = {
            pending: 0,
            accepted: 1,
            delivered: 2,
            completed: 3,
            rejected: 4,
          }

          const aStatus =
            statusOrder[a.status as keyof typeof statusOrder] ?? 99

          const bStatus =
            statusOrder[b.status as keyof typeof statusOrder] ?? 99

          if (aStatus !== bStatus) {
            return aStatus - bStatus
          }

          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          )
        })

        setOrders(sorted)
      })
      .catch((e) =>
        setError(e.response?.data?.message || 'Failed'),
      )
  }

  useEffect(() => {
    getMyShop()
      .then((data) => {
        if (!data) {
          navigate('/', { replace: true })
          return
        }

        setShop(data)
        loadOrders()
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false))
  }, [navigate])

  const act = async (
    fn: (id: number) => Promise<any>,
    id: number,
  ) => {
    try {
      await fn(id)
      loadOrders()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <PageLayout title="Shop Orders">
      {error && <p className="text-sm mb-2">{error}</p>}

      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <div key={order.id} className="border p-3">
            <div className="flex justify-between mb-1">
              <p className="text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <p className="font-medium">
                {order.buyer.username}
              </p>

              <span className="text-xs border px-2">
                {order.status}
              </span>
            </div>

            {order.items.map((i) => (
              <p key={i.id} className="text-sm">
                {i.productName} x{i.quantity} · $
                {(Number(i.price) * i.quantity).toFixed(2)}
              </p>
            ))}

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${shop?.lat},${shop?.lng}&destination=${order.deliveryLat},${order.deliveryLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline block mt-1"
            >
              Navigate
            </a>

            <div className="text-sm mt-1">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  ${Number(order.deliveryFee).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {order.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="border flex-1 py-2 text-sm"
                  onClick={() => act(acceptOrder, order.id)}
                >
                  Accept
                </button>

                <button
                  type="button"
                  className="border flex-1 py-2 text-sm"
                  onClick={() => act(rejectOrder, order.id)}
                >
                  Reject
                </button>
              </div>
            )}

            {order.status === 'accepted' && (
              <button
                type="button"
                className="border w-full py-2 text-sm mt-2"
                onClick={() =>
                  act(deliveredOrder, order.id)
                }
              >
                Mark Delivered
              </button>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <p className="text-sm">No orders yet</p>
        )}
      </div>
    </PageLayout>
  )
}
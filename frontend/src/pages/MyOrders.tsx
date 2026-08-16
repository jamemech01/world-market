import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../layouts/PageLayout'
import { getMyOrders, completeOrder } from '../services/order'

type Order = {
  id: number
  totalAmount: string
  deliveryFee: string
  status: string
  createdAt: string
  deliveryLat: number
  deliveryLng: number
  shop: { id: number; name: string } | null
  items: { id: number; productName: string; quantity: number; price: string }[]
}

export default function MyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = () => {
    getMyOrders()
      .then((orders) => {
        const sorted = [...orders].sort((a, b) => {
          const aAction = a.status === 'delivered' ? 1 : 0
          const bAction = b.status === 'delivered' ? 1 : 0

          if (aAction !== bAction) {
            return bAction - aAction
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
    loadOrders()
    setLoading(false)
  }, [])

  const handleComplete = async (id: number) => {
    try {
      await completeOrder(id)
      loadOrders()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <PageLayout title="My Orders">
      {error && <p className="text-sm mb-2">{error}</p>}

      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <div key={order.id} className="border p-3">
            <div className="flex justify-between mb-1">
              <p className="text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <button
                type="button"
                className="font-medium underline"
                onClick={() => {
                  if (order.shop) {
                    navigate(`/shop/${order.shop.id}`)
                  }
                }}
              >
                {order.shop?.name || 'Shop unavailable'}
              </button>

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
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline block mt-1"
            >
              Navigate
            </a>

            <div className="text-sm mt-1">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>${Number(order.deliveryFee).toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {order.status === 'delivered' && (
              <button
                type="button"
                className="border w-full py-2 text-sm mt-2"
                onClick={() => handleComplete(order.id)}
              >
                Confirm Received
              </button>
            )}
          </div>
        ))}

        {orders.length === 0 && <p className="text-sm">No orders yet</p>}
      </div>
    </PageLayout>
  )
}
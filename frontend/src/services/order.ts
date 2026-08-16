import api from './api'

export const getOrderQuote = async (data: {
  shopId: number
  deliveryLat: number
  deliveryLng: number
}) => {
  const res = await api.post('/orders/quote', data)
  return res.data
}

export const createOrder = async (data: {
  shopId: number
  items: {
    productId: number
    quantity: number
  }[]
  deliveryLat: number
  deliveryLng: number
}) => {
  const res = await api.post('/orders', data)
  return res.data
}

export const getShopOrders = async () => {
  const res = await api.get('/orders/shop')
  return res.data
}

export const getMyOrders = async () => {
  const res = await api.get('/orders/me')
  return res.data
}

export const acceptOrder = async (orderId: number) => {
  const res = await api.patch(`/orders/${orderId}/accept`)
  return res.data
}

export const rejectOrder = async (orderId: number) => {
  const res = await api.patch(`/orders/${orderId}/reject`)
  return res.data
}

export const deliveredOrder = async (orderId: number) => {
  const res = await api.patch(
    `/orders/${orderId}/delivered`
  )
  return res.data
}

export const completeOrder = async (orderId: number) => {
  const res = await api.patch(
    `/orders/${orderId}/complete`
  )
  return res.data
}
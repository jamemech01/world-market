import api from './api'

export const createShop = async (data: {
  name: string
  lat: number
  lng: number
}) => {
  const res = await api.post('/shops', data)
  return res.data
}

export const getShops = async () => {
  const res = await api.get('/shops')
  return res.data
}

export const getShopById = async (id: number) => {
  const res = await api.get(`/shops/${id}`)
  return res.data
}

export const getMyShop = async () => {
  const res = await api.get('/shops/me')
  return res.data
}

export const updateShop = async (data: {
  name: string
}) => {
  const res = await api.patch('/shops', data)
  return res.data
}

export const deleteShop = async () => {
  const res = await api.delete('/shops')
  return res.data
}

export const openShop = async (code: string) => {
  const res = await api.post('/shops/request-open', { code })
  return res.data
}
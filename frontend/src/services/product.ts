import api from './api'

export const createProduct = async (data: {
  name: string
  price: number
  stock: number
}) => {
  const res = await api.post('/products', data)
  return res.data
}

export const getProductsByShop = async (shopId: number) => {
  const res = await api.get(`/products/shop/${shopId}`)
  return res.data
}

// Edit Product: name + price
export const updateProduct = async (
  id: number,
  data: {
    name: string
    price: number
  },
) => {
  const res = await api.patch(`/products/${id}`, data)
  return res.data
}

// Update Stock: stock only
export const updateProductStock = async (
  id: number,
  stock: number,
) => {
  const res = await api.patch(`/products/${id}/stock`, {
    stock,
  })
  return res.data
}

// Delete Product
export const deleteProduct = async (
  id: number,
) => {
  const res = await api.delete(`/products/${id}`)
  return res.data
}
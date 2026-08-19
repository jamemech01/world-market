import api from './api'

export const createProduct = async (data: {
  name: string
  category?: string
  price: number
  stock: number
  image?: File
}) => {
  const formData = new FormData()

  formData.append('name', data.name)

  if (data.category) {
    formData.append('category', data.category)
  }

  formData.append('price', String(data.price))
  formData.append('stock', String(data.stock))

  if (data.image) {
    formData.append('image', data.image)
  }

  const res = await api.post('/products', formData)

  return res.data
}

export const getProductsByShop = async (
  shopId: number,
) => {
  const res = await api.get(
    `/products/shop/${shopId}`,
  )

  return res.data
}

export const updateProduct = async (
  id: number,
  data: {
    name: string
    category?: string
    price: number
  },
) => {
  const res = await api.patch(
    `/products/${id}`,
    data,
  )

  return res.data
}

export const updateProductImage = async (
  id: number,
  image: File,
) => {
  const formData = new FormData()

  formData.append('image', image)

  const res = await api.patch(
    `/products/${id}/image`,
    formData,
  )

  return res.data
}

export const updateProductStock = async (
  id: number,
  stock: number,
) => {
  const res = await api.patch(
    `/products/${id}/stock`,
    { stock },
  )

  return res.data
}

export const deleteProduct = async (
  id: number,
) => {
  const res = await api.delete(
    `/products/${id}`,
  )

  return res.data
}
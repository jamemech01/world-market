import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../layouts/PageLayout'
import SearchBar from '../components/SearchBar'
import FilterSelect from '../components/FilterSelect'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { getMyShop, updateShop, deleteShop } from '../services/shop'
import {
  createProduct,
  getProductsByShop,
  updateProduct,
  updateProductImage,
  updateProductStock,
  deleteProduct,
} from '../services/product'

type Product = {
  id: number
  name: string
  category: string
  price: string
  stock: number
  imageUrl?: string | null
}

type Shop = {
  id: number
  name: string
  lat: number
  lng: number
}

type ModalType =
  | 'add'
  | 'edit'
  | 'image'
  | 'stock'
  | null

const PAGE_SIZE = 10

export default function ShopManage() {
  const navigate = useNavigate()

  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState('')

  const [shopName, setShopName] = useState('')
  const [editingShop, setEditingShop] = useState(false)
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<Product | null>(null)
  const [deleteShopOpen, setDeleteShopOpen] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const stockRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const loadProducts = async (shopId: number) => {
    try {
      setProducts(await getProductsByShop(shopId))
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    getMyShop()
      .then((data) => {
        if (!data) {
          navigate('/', { replace: true })
          return
        }

        setShop(data)
        setShopName(data.name)
        loadProducts(data.id)
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false))
  }, [navigate])

  const categoryOptions = useMemo(() => {
    const categories = [
      ...new Set(
        products
          .map((product) => product.category?.trim())
          .filter(Boolean),
      ),
    ]

    return [
      { label: 'All categories', value: 'all' },
      ...categories.map((category) => ({
        label: category,
        value: category,
      })),
    ]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesCategory =
        filter === 'all' || product.category === filter

      return matchesSearch && matchesCategory
    })
  }, [products, search, filter])

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  )

  const paged = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const resetForm = () => {
    setName('')
    setCategory('')
    setPrice('')
    setStock('')
    setImage(undefined)
    setImagePreview('')
    setError('')
    setSelected(null)

    if (imageRef.current) {
      imageRef.current.value = ''
    }
  }

  const closeModal = () => {
    if (saving) return

    setModal(null)
    resetForm()
  }

  const handleSaveShopName = async () => {
    setError('')

    if (!shopName.trim()) {
      setError('Enter shop name')
      return
    }

    try {
      setSaving(true)

      const data = await updateShop({
        name: shopName.trim(),
      })

      setShop(data)
      setEditingShop(false)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitProduct = async () => {
    setError('')

    const productPrice = Number(price)
    const productStock = Number(stock)

    if (!name.trim()) {
      setError('Enter product name')
      return
    }

    if (
      price === '' ||
      !Number.isFinite(productPrice) ||
      productPrice <= 0
    ) {
      setError('Price must be greater than 0')
      return
    }

    if (
      modal === 'add' &&
      (stock === '' ||
        !Number.isInteger(productStock) ||
        productStock < 0)
    ) {
      setError('Enter a valid stock number')
      return
    }

    try {
      setSaving(true)

      if (modal === 'add') {
        await createProduct({
          name: name.trim(),
          category: category.trim(),
          price: productPrice,
          stock: productStock,
          image,
        })
      }

      if (modal === 'edit' && selected) {
        await updateProduct(selected.id, {
          name: name.trim(),
          category: category.trim(),
          price: productPrice,
        })
      }

      if (shop) {
        await loadProducts(shop.id)
      }

      closeModal()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateImage = async () => {
    if (!selected || !image) {
      setError('Select an image')
      return
    }

    setError('')

    try {
      setSaving(true)

      await updateProductImage(selected.id, image)

      if (shop) {
        await loadProducts(shop.id)
      }

      closeModal()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStock = async () => {
    if (!selected) return

    setError('')

    const value = Number(stock)

    if (
      stock === '' ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      setError('Enter a valid stock number')
      return
    }

    try {
      setSaving(true)

      await updateProductStock(selected.id, value)

      if (shop) {
        await loadProducts(shop.id)
      }

      closeModal()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget || !shop) return

    try {
      setSaving(true)

      await deleteProduct(deleteProductTarget.id)
      await loadProducts(shop.id)

      setDeleteProductTarget(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteShop = async () => {
    try {
      setSaving(true)

      await deleteShop()

      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
      setDeleteShopOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!shop) {
    return null
  }

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-3">
        <h1 className="min-w-0 flex-1 truncate text-lg font-medium">
          {shop.name}
        </h1>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="border px-3 py-2 text-sm"
            onClick={() => {
              setShopName(shop.name)
              setError('')
              setEditingShop(true)
            }}
          >
            Rename
          </button>

          <button
            type="button"
            className="border px-3 py-2 text-sm"
            onClick={() => {
              setError('')
              setDeleteShopOpen(true)
            }}
          >
            Delete Shop
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className="shrink-0 border px-3 py-2 text-sm"
          onClick={() => {
            resetForm()
            setModal('add')
          }}
        >
          Add
        </button>

        <div className="shrink-0">
          <FilterSelect
            value={filter}
            onChange={(value) => {
              setFilter(value)
              setPage(1)
            }}
            options={categoryOptions}
          />
        </div>

        <div className="min-w-0 flex-1">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 items-stretch">
        {paged.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard
              product={product}
              onEditImage={() => {
                setError('')
                setSelected(product)
                setImage(undefined)
                setImagePreview(product.imageUrl || '')
                setModal('image')
              }}
              actions={
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <button
                    type="button"
                    className="border py-1 text-xs"
                    onClick={() => {
                      setError('')
                      setSelected(product)
                      setName(product.name)
                      setCategory(product.category)
                      setPrice(product.price)
                      setModal('edit')
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="border py-1 text-xs"
                    onClick={() => {
                      setError('')
                      setSelected(product)
                      setStock(String(product.stock))
                      setModal('stock')
                    }}
                  >
                    Stock
                  </button>

                  <button
                    type="button"
                    className="border py-1 text-xs"
                    onClick={() => {
                      setError('')
                      setDeleteProductTarget(product)
                    }}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          </div>
        ))}

        {paged.length === 0 && (
          <p className="text-sm col-span-2">
            No products found
          </p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />

      {error && !modal && !editingShop && (
        <p className="text-sm mt-4">{error}</p>
      )}

      {editingShop && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white border p-4 w-full max-w-sm">
            <h2 className="font-medium mb-2">
              Rename Shop
            </h2>

            <input
              autoFocus
              className="w-full border px-3 py-2 mb-2"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveShopName()
                }
              }}
              maxLength={20}
              disabled={saving}
            />

            {error && (
              <p className="text-sm mb-2">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border px-3 py-2"
                onClick={() => {
                  setError('')
                  setEditingShop(false)
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="border px-3 py-2"
                onClick={handleSaveShopName}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white border p-4 w-full max-w-sm">
            <h2 className="font-medium mb-2">
              {modal === 'add'
                ? 'Add Product'
                : modal === 'edit'
                  ? 'Edit Product'
                  : modal === 'image'
                    ? 'Edit Image'
                    : 'Update Stock'}
            </h2>

            {(modal === 'add' || modal === 'edit') && (
              <>
                <input
                  ref={nameRef}
                  autoFocus
                  className="w-full border px-3 py-2 mb-2"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      categoryRef.current?.focus()
                    }
                  }}
                  disabled={saving}
                />

                <input
                  ref={categoryRef}
                  className="w-full border px-3 py-2 mb-2"
                  placeholder="Category (optional)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      priceRef.current?.focus()
                    }
                  }}
                  maxLength={20}
                  disabled={saving}
                />

                <input
                  ref={priceRef}
                  className="w-full border px-3 py-2 mb-2"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (modal === 'add') {
                        stockRef.current?.focus()
                      } else {
                        handleSubmitProduct()
                      }
                    }
                  }}
                  disabled={saving}
                />

                {modal === 'add' && (
                  <input
                    ref={stockRef}
                    className="w-full border px-3 py-2 mb-2"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Stock"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        imageRef.current?.focus()
                      }
                    }}
                    disabled={saving}
                  />
                )}

                {modal === 'add' && (
                  <>
                    <input
                      ref={imageRef}
                      className="w-full border px-3 py-2 mb-2"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]

                        setImage(file)

                        if (file) {
                          setImagePreview(
                            URL.createObjectURL(file),
                          )
                        } else {
                          setImagePreview('')
                        }
                      }}
                      disabled={saving}
                    />

                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full aspect-square object-cover border mb-2"
                      />
                    )}
                  </>
                )}
              </>
            )}

            {modal === 'image' && (
              <>
                <input
                  ref={imageRef}
                  autoFocus
                  className="w-full border px-3 py-2 mb-2"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]

                    setImage(file)

                    if (file) {
                      setImagePreview(
                        URL.createObjectURL(file),
                      )
                    } else {
                      setImagePreview(
                        selected?.imageUrl || '',
                      )
                    }
                  }}
                  disabled={saving}
                />

                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full aspect-square object-cover border mb-2"
                  />
                )}
              </>
            )}

            {modal === 'stock' && (
              <input
                autoFocus
                className="w-full border px-3 py-2 mb-2"
                type="number"
                min="0"
                step="1"
                placeholder="Stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateStock()
                  }
                }}
                disabled={saving}
              />
            )}

            {error && (
              <p className="text-sm mb-2">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border px-3 py-2"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="border px-3 py-2"
                disabled={saving}
                onClick={
                  modal === 'stock'
                    ? handleUpdateStock
                    : modal === 'image'
                      ? handleUpdateImage
                      : handleSubmitProduct
                }
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProductTarget && (
        <ConfirmDialog
          title="Delete Product"
          message={`Delete "${deleteProductTarget.name}"?`}
          loading={saving}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeleteProductTarget(null)}
        />
      )}

      {deleteShopOpen && (
        <ConfirmDialog
          title="Delete Shop"
          message="Delete this shop and all its products?"
          loading={saving}
          onConfirm={handleDeleteShop}
          onCancel={() => setDeleteShopOpen(false)}
        />
      )}
    </PageLayout>
  )
}
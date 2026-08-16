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
  updateProductStock,
  deleteProduct,
} from '../services/product'

type Product = { id: number; name: string; price: string; stock: number }
type Shop = { id: number; name: string; lat: number; lng: number }
type ModalType = 'add' | 'edit' | 'stock' | null

const PAGE_SIZE = 8

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
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')

  const [shopName, setShopName] = useState('')
  const [editingShop, setEditingShop] = useState(false)
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null)
  const [deleteShopOpen, setDeleteShopOpen] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const stockRef = useRef<HTMLInputElement>(null)

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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesFilter =
        filter === 'all' ||
        (filter === 'in_stock' && p.stock > 0) ||
        (filter === 'out_of_stock' && p.stock === 0)

      return matchesSearch && matchesFilter
    })
  }, [products, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetForm = () => {
    setName('')
    setPrice('')
    setStock('')
    setError('')
    setSelected(null)
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
      const data = await updateShop({ name: shopName.trim() })
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

    if (!name.trim() || !price || (modal === 'add' && !stock)) {
      setError('Fill in all fields')
      return
    }

    try {
      setSaving(true)

      if (modal === 'add') {
        await createProduct({
          name: name.trim(),
          price: Number(price),
          stock: Number(stock),
        })
      } else if (modal === 'edit' && selected) {
        await updateProduct(selected.id, {
          name: name.trim(),
          price: Number(price),
        })
      }

      if (shop) await loadProducts(shop.id)
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

    const n = Number(stock)

    if (stock === '' || !Number.isInteger(n) || n < 0) {
      setError('Enter a valid stock number')
      return
    }

    try {
      setSaving(true)
      await updateProductStock(selected.id, n)

      if (shop) await loadProducts(shop.id)

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

  if (loading) return <div className="p-4">Loading...</div>
  if (!shop) return null

  return (
    <PageLayout title={shop.name}>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className="border px-3 py-2 text-sm"
          onClick={() => {
            setShopName(shop.name)
            setEditingShop(true)
          }}
        >
          Rename
        </button>

        <button
          type="button"
          className="border px-3 py-2 text-sm"
          onClick={() => setDeleteShopOpen(true)}
        >
          Delete Shop
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium">Products</h2>

        <button
          type="button"
          className="border px-3 py-2 text-sm"
          onClick={() => {
            resetForm()
            setModal('add')
          }}
        >
          Add
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
      />

      <FilterSelect
        value={filter}
        onChange={(v) => {
          setFilter(v)
          setPage(1)
        }}
        options={[
          { label: 'All', value: 'all' },
          { label: 'In stock', value: 'in_stock' },
          { label: 'Out of stock', value: 'out_of_stock' },
        ]}
      />

      <div className="grid grid-cols-2 gap-2 mt-2">
        {paged.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            actions={
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button
                  type="button"
                  className="border py-1 text-xs"
                  onClick={() => {
                    setSelected(product)
                    setName(product.name)
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
                  onClick={() => setDeleteProductTarget(product)}
                >
                  Delete
                </button>
              </div>
            }
          />
        ))}

        {paged.length === 0 && (
          <p className="text-sm col-span-2">No products found</p>
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
            <h2 className="font-medium mb-2">Rename Shop</h2>

            <input
              autoFocus
              className="w-full border px-3 py-2 mb-2"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveShopName()
              }}
              maxLength={20}
              disabled={saving}
            />

            {error && <p className="text-sm mb-2">{error}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border px-3 py-2"
                onClick={() => setEditingShop(false)}
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
                      priceRef.current?.focus()
                    }
                  }}
                  disabled={saving}
                />

                <input
                  ref={priceRef}
                  className="w-full border px-3 py-2 mb-2"
                  type="number"
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
                    placeholder="Stock"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitProduct()
                      }
                    }}
                    disabled={saving}
                  />
                )}
              </>
            )}

            {modal === 'stock' && (
              <input
                autoFocus
                className="w-full border px-3 py-2 mb-2"
                type="number"
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

            {error && <p className="text-sm mb-2">{error}</p>}

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
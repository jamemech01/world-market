import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../layouts/PageLayout'
import SearchBar from '../components/SearchBar'
import FilterSelect from '../components/FilterSelect'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import { getProductsByShop } from '../services/product'
import { getShopById } from '../services/shop'

type Product = { id: number; name: string; price: string; stock: number }
type Shop = { id: number; name: string; lat: number; lng: number }

const PAGE_SIZE = 8

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Record<number, number>>({})

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!id) return
    Promise.all([getProductsByShop(Number(id)), getShopById(Number(id))])
      .then(([p, s]) => {
        setProducts(p)
        setShop(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

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

  const changeQty = (productId: number, delta: number, max: number) => {
    setCart((prev) => {
      const next = Math.max(0, Math.min(max, (prev[productId] || 0) + delta))
      if (next === 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: next }
    })
  }

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const p = products.find((x) => x.id === Number(pid))
    return sum + (p ? Number(p.price) * qty : 0)
  }, 0)

  const handleBuy = () => {
    if (!shop) return
    sessionStorage.setItem(
      'order_confirm',
      JSON.stringify({
        shopId: Number(id),
        shopLat: shop.lat,
        shopLng: shop.lng,
        items: Object.entries(cart).map(([pid, qty]) => ({ productId: Number(pid), quantity: qty })),
        totalPrice,
        totalItems,
      }),
    )
    navigate('/order-confirm')
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <PageLayout title={shop?.name || 'Products'}>
      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
      <FilterSelect
        value={filter}
        onChange={(v) => { setFilter(v); setPage(1) }}
        options={[
          { label: 'All', value: 'all' },
          { label: 'In stock', value: 'in_stock' },
          { label: 'Out of stock', value: 'out_of_stock' },
        ]}
      />

      <div className="grid grid-cols-2 gap-2 mt-2 pb-24">
        {paged.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            actions={
              product.stock > 0 ? (
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" className="border w-7 h-7" onClick={() => changeQty(product.id, -1, product.stock)}>-</button>
                  <span className="text-sm">{cart[product.id] || 0}</span>
                  <button type="button" className="border w-7 h-7" onClick={() => changeQty(product.id, 1, product.stock)}>+</button>
                </div>
              ) : (
                <p className="text-sm mt-2">Out of stock</p>
              )
            }
          />
        ))}
        {paged.length === 0 && <p className="text-sm col-span-2">No products found</p>}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-2xl mx-auto">
            <button type="button" className="w-full border py-3" onClick={handleBuy}>
              Buy {totalItems} item{totalItems > 1 ? 's' : ''} · ${totalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
import type { ReactNode } from 'react'

type Product = {
  id: number
  name: string
  price: string
  stock: number
}

type Props = {
  product: Product
  actions?: ReactNode
}

export default function ProductCard({ product, actions }: Props) {
  return (
    <div className="border p-3 flex flex-col gap-1">
      <p className="font-medium">{product.name}</p>
      <p className="text-sm">
        ${Number(product.price).toFixed(2)} · Stock {product.stock}
      </p>
      {actions}
    </div>
  )
}
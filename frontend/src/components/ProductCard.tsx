import type { ReactNode } from 'react'

type Product = {
  id: number
  name: string
  category: string
  price: string
  stock: number
  imageUrl?: string | null
}

type Props = {
  product: Product
  actions?: ReactNode
  onEditImage?: () => void
}

export default function ProductCard({
  product,
  actions,
  onEditImage,
}: Props) {
  return (
    <div className="border flex flex-col h-full overflow-hidden">
      <div className="relative w-full aspect-[1/1] overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}

        {onEditImage && (
          <button
            type="button"
            className="absolute top-1 right-1 bg-white border px-2 py-1 text-xs"
            onClick={onEditImage}
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-medium line-clamp-2 min-h-[3rem]">
          {product.name}
        </p>

        <p className="text-xs text-gray-500 line-clamp-1 min-h-[1rem]">
          {product.category || '\u00A0'}
        </p>

        <p className="text-sm">
          ${Number(product.price).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} · Stock {product.stock}
        </p>

        {actions}
      </div>
    </div>
  )
}
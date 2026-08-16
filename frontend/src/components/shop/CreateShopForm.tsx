import { useEffect, useState } from 'react'
import { createShop } from '../../services/shop'

type Props = {
  lat: number
  lng: number
  onSuccess: () => void
  onCancel: () => void
}

export default function CreateShopForm({ lat, lng, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(true)

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`,
    )
      .then((res) => res.json())
      .then((data) => setAddress(data.display_name || 'Unknown location'))
      .catch(() => setAddress('Unable to get address'))
      .finally(() => setLoadingAddress(false))
  }, [lat, lng])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter shop name')
      return
    }

    try {
      await createShop({ name: name.trim(), lat, lng })
      onSuccess()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create shop')
    }
  }

  return (
    <form
      className="fixed top-20 left-1/2 -translate-x-1/2 bg-white border p-4 w-80"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      <h2 className="font-medium mb-2">New Shop</h2>

      <input
        autoFocus
        className="w-full border px-3 py-2 mb-2"
        placeholder="Shop name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="border p-2 mb-2 text-sm">
        {loadingAddress ? 'Getting address...' : address}
      </div>

      {error && <p className="text-sm mb-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="border px-3 py-2">
          Create
        </button>

        <button type="button" className="border px-3 py-2" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
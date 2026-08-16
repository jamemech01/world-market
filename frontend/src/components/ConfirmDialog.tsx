type Props = {
  title: string
  message: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white border p-4 w-full max-w-sm">
        <h2 className="font-medium mb-2">{title}</h2>
        <p className="text-sm mb-4">{message}</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="border px-3 py-2"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="border px-3 py-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
type Props = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        type="button"
        className="border px-3 py-1 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className="border px-3 py-1 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <input
      className="w-full border px-3 py-2 mb-2"
      placeholder={placeholder || 'Search'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
type Props = {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}

export default function FilterSelect({ value, onChange, options }: Props) {
  return (
    <select
      className="border px-3 py-2 mb-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
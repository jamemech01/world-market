import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  onBack?: () => void
}

export default function PageLayout({ title, children, onBack }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh w-full">
      <header className="flex items-center gap-3 p-4 border-b">
        <button
          type="button"
          className="border px-3 py-1"
          onClick={onBack || (() => navigate(-1))}
        >
          Back
        </button>

        <h1 className="text-lg font-medium">{title}</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  )
}
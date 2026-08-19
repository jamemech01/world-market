import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import WalletSummary from '../components/WalletSummary'

type Props = {
  children: ReactNode
  onBack?: () => void
}

export default function PageLayout({
  children,
  onBack,
}: Props) {
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

        <div className="ml-auto">
          <WalletSummary />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  )
}
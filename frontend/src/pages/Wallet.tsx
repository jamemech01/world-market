import { useEffect, useState } from 'react'
import PageLayout from '../layouts/PageLayout'
import { getMyWallet, topupWallet } from '../services/wallet'

type Transaction = { id: number; type: string; amount: string; createdAt: string }

export default function Wallet() {
  const [balance, setBalance] = useState('0')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadWallet = () => {
    getMyWallet()
      .then((d) => {
        setBalance(d.balance)
        setTransactions(d.transactions)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadWallet() }, [])

  const handleTopup = async () => {
    setError('')
    const n = Number(amount)
    if (!amount || Number.isNaN(n) || n <= 0) {
      setError('Enter a valid amount')
      return
    }
    try {
      await topupWallet(amount)
      setAmount('')
      loadWallet()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <PageLayout title="Wallet">
      <p className="text-2xl font-medium mb-4">${Number(balance).toFixed(2)}</p>

      <div className="border p-3 mb-4">
        <input
          autoFocus
          className="w-full border px-3 py-2 mb-2"
          placeholder="Amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTopup()
            }
          }}
        />
        {error && <p className="text-sm mb-2">{error}</p>}
        <button type="button" className="border px-3 py-2" onClick={handleTopup}>Top Up</button>
      </div>

      <div className="flex flex-col gap-2">
        {transactions.map((t) => (
          <div key={t.id} className="border p-2 flex justify-between text-sm">
            <span>{t.type}</span>
            <span>{t.type === 'hold' ? '-' : '+'}${Number(t.amount).toFixed(2)}</span>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-sm">No transactions yet</p>}
      </div>
    </PageLayout>
  )
}
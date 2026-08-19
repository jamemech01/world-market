import { useEffect, useState } from 'react'
import PageLayout from '../layouts/PageLayout'
import ConfirmDialog from '../components/ConfirmDialog'
import { getMyWallet, topupWallet } from '../services/wallet'

type Order = {
  id: number
  totalAmount: string
  deliveryFee: string
  status: string
  createdAt: string
  shop: {
    id: number
    name: string
  } | null
  items: {
    id: number
    productName: string
    quantity: number
    price: string
  }[]
}

type Transaction = {
  id: number
  type: string
  amount: string
  createdAt: string
  order: Order | null
}

export default function Wallet() {
  const [balance, setBalance] = useState('0')
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([])

  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmTopup, setConfirmTopup] = useState(false)
  const [expandedId, setExpandedId] =
    useState<number | null>(null)

  const loadWallet = async () => {
    try {
      const data = await getMyWallet()

      setBalance(String(data.balance))
      setTransactions(data.transactions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

  const handleTopup = () => {
    setError('')

    const value = Number(amount)

    if (
      !amount ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setError('Enter a valid amount')
      return
    }

    setConfirmTopup(true)
  }

  const confirmTopupAction = async () => {
    try {
      setSaving(true)

      await topupWallet(amount)

      setAmount('')
      setConfirmTopup(false)
      await loadWallet()
    } catch (e: any) {
      setError(
        e.response?.data?.message || 'Failed',
      )
      setConfirmTopup(false)
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getLabel = (type: string) => {
    switch (type) {
      case 'topup':
        return 'Top Up'
      case 'refund':
        return 'Refund'
      case 'sale':
        return 'Sale'
      case 'purchase':
        return 'Purchase'
      default:
        return type
    }
  }

  const isPositive = (type: string) =>
    type === 'topup' ||
    type === 'refund' ||
    type === 'sale'

  if (loading) {
    return (
      <PageLayout>
        <p className="text-sm">Loading...</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <h1 className="text-lg font-medium mb-4">
        Wallet
      </h1>

      <div className="border p-4 mb-4">
        <p className="text-sm text-gray-500">
          Balance
        </p>

        <p className="text-2xl font-medium mt-1">
          ฿{Number(balance).toFixed(2)}
        </p>
      </div>

      <div className="border p-4 mb-6">
        <h2 className="font-medium mb-3">
          Top Up
        </h2>

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
          disabled={saving}
        />

        {error && (
          <p className="text-sm mb-2">
            {error}
          </p>
        )}

        <button
          type="button"
          className="border px-4 py-2"
          onClick={handleTopup}
          disabled={saving}
        >
          Top Up
        </button>
      </div>

      <h2 className="text-lg font-medium mb-3">
        Transactions
      </h2>

      <div className="flex flex-col gap-2">
        {transactions.map((transaction) => {
          const hasOrder = !!transaction.order
          const expanded =
            expandedId === transaction.id
          const positive = isPositive(
            transaction.type,
          )

          return (
            <div
              key={transaction.id}
              className="border"
            >
              <button
                type="button"
                className="w-full p-3 text-left"
                disabled={!hasOrder}
                onClick={() =>
                  setExpandedId(
                    expanded
                      ? null
                      : transaction.id,
                  )
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {getLabel(transaction.type)}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(
                        transaction.createdAt,
                      )}
                    </p>
                  </div>

                  <p className="font-medium whitespace-nowrap">
                    {positive ? '+' : '-'}
                    ฿
                    {Number(
                      transaction.amount,
                    ).toFixed(2)}
                  </p>
                </div>
              </button>

              {expanded && transaction.order && (
                <div className="border-t p-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="font-medium truncate">
                      {transaction.order.shop?.name ||
                        'Shop unavailable'}
                    </p>

                    <span className="text-xs border px-2 py-1 shrink-0">
                      {transaction.order.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    Order #
                    {transaction.order.id} ·{' '}
                    {formatDateTime(
                      transaction.order.createdAt,
                    )}
                  </p>

                  <div className="flex flex-col gap-1">
                    {transaction.order.items.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {item.productName} ×{' '}
                            {item.quantity}
                          </span>

                          <span className="whitespace-nowrap">
                            ฿
                            {(
                              Number(item.price) *
                              item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="border-t mt-3 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>

                      <span>
                        ฿
                        {transaction.order.items
                          .reduce(
                            (sum, item) =>
                              sum +
                              Number(item.price) *
                                item.quantity,
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery</span>

                      <span>
                        ฿
                        {Number(
                          transaction.order.deliveryFee,
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between font-medium mt-1">
                      <span>Total</span>

                      <span>
                        ฿
                        {Number(
                          transaction.order.totalAmount,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {transactions.length === 0 && (
          <div className="border p-4 text-sm text-gray-500">
            No transactions yet
          </div>
        )}
      </div>

      {confirmTopup && (
        <ConfirmDialog
          title="Top Up"
          message={`Top up ฿${Number(amount).toFixed(2)}?`}
          loading={saving}
          onConfirm={confirmTopupAction}
          onCancel={() =>
            setConfirmTopup(false)
          }
        />
      )}
    </PageLayout>
  )
}
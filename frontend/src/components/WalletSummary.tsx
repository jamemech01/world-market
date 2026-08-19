import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyWallet } from '../services/wallet'

export default function WalletSummary() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState('0')

  useEffect(() => {
    getMyWallet()
      .then((data) => setBalance(data.balance))
      .catch(() => { })
  }, [])

  return (
    <button
      type="button"
      className="w-[200px] border bg-white px-4 py-2 text-left hover:bg-gray-50"
      onClick={() => navigate('/wallet')}
    >
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>฿</span>

        <span>
          {Number(balance).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </button>
  )
}
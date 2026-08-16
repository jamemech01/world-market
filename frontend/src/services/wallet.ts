import api from './api'

export const getMyWallet = async () => {
  const res = await api.get('/wallet/me')
  return res.data
}

export const topupWallet = async (amount: string) => {
  const res = await api.post('/wallet/topup', { amount })
  return res.data
}
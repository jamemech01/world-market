import { useState, useRef } from 'react'
import axios from 'axios'

const API = `https://${import.meta.env.VITE_API_URL}`

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setError('')
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, { username, password })
        setIsRegister(false)
        setError('Registered successfully, please login')
      } else {
        const res = await axios.post(`${API}/auth/login`, { username, password })
        localStorage.setItem('token', res.data.access_token)
        localStorage.setItem('userId', res.data.userId)
        window.location.href = '/market'
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-80 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">{isRegister ? 'Register' : 'Login'}</h1>

        <input
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
        />

        <input
          ref={passwordRef}
          type="password"
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (isRegister ? confirmRef.current?.focus() : handleSubmit())}
        />

        {isRegister && (
          <input
            ref={confirmRef}
            type="password"
            className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        )}

        {error && <p className="text-sm text-center text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white rounded py-2 font-semibold hover:bg-blue-600"
        >
          {isRegister ? 'Register' : 'Login'}
        </button>

        <p
          className="text-sm text-center text-gray-500 cursor-pointer hover:underline"
          onClick={() => { setIsRegister(!isRegister); setError('') }}
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}
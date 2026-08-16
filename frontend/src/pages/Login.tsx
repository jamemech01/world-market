import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setError('')

    if (!username || !password) {
      setError('Fill in all fields')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const res = await api.post(endpoint, { username, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-medium mb-4 text-center">
          {isRegister ? 'Register' : 'Login'}
        </h1>

        <div className="flex flex-col gap-2">
          <input
            className="border px-3 py-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
          />

          <input
            ref={passwordRef}
            className="border px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              (isRegister ? confirmRef.current?.focus() : handleSubmit())
            }
          />

          {isRegister && (
            <input
              ref={confirmRef}
              className="border px-3 py-2"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          )}

          {error && <p className="text-sm">{error}</p>}

          <button type="button" className="border px-3 py-2" onClick={handleSubmit}>
            {isRegister ? 'Register' : 'Login'}
          </button>

          <button
            type="button"
            className="text-sm underline"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
          >
            {isRegister ? 'Have an account? Login' : 'No account? Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
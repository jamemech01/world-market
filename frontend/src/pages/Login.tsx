import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const lastUsername =
      localStorage.getItem('last_username') || ''

    setUsername(lastUsername)

    if (lastUsername) {
      passwordRef.current?.focus()
    } else {
      usernameRef.current?.focus()
    }
  }, [])

  const handleSubmit = async () => {
    if (loading) return

    setError('')
    setSlow(false)

    if (!username || !password) {
      setError('Fill in all fields')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const timer = setTimeout(() => {
      setSlow(true)
    }, 2000)

    try {
      setLoading(true)

      const endpoint = isRegister
        ? '/auth/register'
        : '/auth/login'

      const res = await api.post(endpoint, {
        username,
        password,
      })

      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('last_username', username)

      sessionStorage.removeItem('home_map_view')

      navigate('/')
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          'Something went wrong',
      )
    } finally {
      clearTimeout(timer)
      setLoading(false)
      setSlow(false)
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
            ref={usernameRef}
            className="border px-3 py-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              passwordRef.current?.focus()
            }
            disabled={loading}
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
              (isRegister
                ? confirmRef.current?.focus()
                : handleSubmit())
            }
            disabled={loading}
          />

          {isRegister && (
            <input
              ref={confirmRef}
              className="border px-3 py-2"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === 'Enter' && handleSubmit()
              }
              disabled={loading}
            />
          )}

          {slow && !error && (
            <p className="text-sm">
              Server is starting, please wait...
            </p>
          )}

          {error && (
            <p className="text-sm">
              {error}
            </p>
          )}

          <button
            type="button"
            className="border px-3 py-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? isRegister
                ? 'Registering...'
                : 'Logging in...'
              : isRegister
                ? 'Register'
                : 'Login'}
          </button>

          <button
            type="button"
            className="text-sm underline"
            onClick={() => {
              if (loading) return

              setIsRegister(!isRegister)
              setError('')
              setSlow(false)
            }}
            disabled={loading}
          >
            {isRegister
              ? 'Have an account? Login'
              : 'No account? Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
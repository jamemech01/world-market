import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Login() {
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const inputClass = 'w-full border rounded-lg px-4 py-3 outline-none'

  const handleSubmit = async () => {
    setError('')

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, { username, password })

        setError('Register successful. Please login.')
        setIsRegister(false)
        setPassword('')
        setConfirmPassword('')

        return
      }

      const res = await axios.post(`${API}/auth/login`, { username, password })

      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (e: any) {
      const message = Array.isArray(e.response?.data?.message)
        ? e.response.data.message[0]
        : e.response?.data?.message || 'Something went wrong'

      setError(message)
    }
  }

  const handleToggleRegister = () => {
    setIsRegister(!isRegister)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleUsernameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      passwordRef.current?.focus()
    }
  }

  const handlePasswordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key !== 'Enter') return

    if (isRegister) {
      confirmRef.current?.focus()
      return
    }

    handleSubmit()
  }

  const handleConfirmPasswordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen flex justify-center p-4">
      <div className="w-full max-w-sm mt-24">
        <h1 className="text-center text-2xl font-semibold mb-8">
          {isRegister ? 'Register' : 'Login'}
        </h1>

        <div className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleUsernameKeyDown}
          />

          <input
            ref={passwordRef}
            className={inputClass}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handlePasswordKeyDown}
          />

          <div
            className="h-[52px] overflow-hidden"
            style={{ visibility: isRegister ? 'visible' : 'hidden' }}
          >
            <input
              ref={confirmRef}
              className={inputClass}
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleConfirmPasswordKeyDown}
            />
          </div>

          <div className="h-10 flex items-center justify-center overflow-hidden">
            <p className="text-sm text-center">{error}</p>
          </div>

          <button
            className="w-1/2 self-center border rounded-lg py-3 text-sm font-medium transition-transform duration-150 active:scale-95"
            onClick={handleSubmit}
          >
            {isRegister ? 'Register' : 'Login'}
          </button>

          <button
            type="button"
            className="self-center px-2 py-1 text-sm underline underline-offset-4"
            onClick={handleToggleRegister}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
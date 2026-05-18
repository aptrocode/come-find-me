import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '../store/useAuthStore.ts'
import './auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Login | First See Mie'
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => { clearError() }, [clearError])

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordFilled = password.length > 0
  const canSubmit = isValidEmail && isPasswordFilled

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!canSubmit) return

    setIsSubmitting(true)
    const success = await login(email.trim(), password)
    setIsSubmitting(false)
    if (success) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <h1 className="auth-logo-title">First See Mie</h1>
        <p className="auth-logo-subtitle">Catch them all!</p>
      </div>

      <div className="auth-card">
        <h2 className="auth-card-title">Masuk</h2>
        <p className="auth-card-desc">Login untuk melanjutkan petualanganmu</p>

        {error && (
          <div className="auth-error">
            <Icon icon="ph:warning-circle-duotone" className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                className={`auth-input ${submitted && !isValidEmail ? 'error' : ''}`}
                placeholder="contoh@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {submitted && !isValidEmail && (
              <span className="auth-field-error">Format email tidak valid</span>
            )}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${submitted && !isPasswordFilled ? 'error' : ''}`}
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <Icon icon={showPassword ? 'ph:eye-slash-duotone' : 'ph:eye-duotone'} />
              </button>
            </div>
            {submitted && !isPasswordFilled && (
              <span className="auth-field-error">Password harus diisi</span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Belum punya akun? <Link to="/register">Daftar sekarang</Link>
      </p>
    </div>
  )
}

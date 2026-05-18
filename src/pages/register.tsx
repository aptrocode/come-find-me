import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '../store/useAuthStore.ts'
import './auth.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated, error, clearError } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Register | First See Mie'
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => { clearError() }, [clearError])

  const passwordsMatch = password === confirmPassword && password.length > 0
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 6 && password.length <= 20
  const isNameValid = name.trim().length >= 2 && name.trim().length <= 50
  const canSubmit = isNameValid && isValidEmail && isPasswordValid && passwordsMatch && agreed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!canSubmit) return

    setIsSubmitting(true)
    const success = await register(name.trim(), email.trim(), password)
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
        <h2 className="auth-card-title">Buat Akun</h2>
        <p className="auth-card-desc">Daftar untuk mulai petualanganmu</p>

        {error && (
          <div className="auth-error">
            <Icon icon="ph:warning-circle-duotone" className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="auth-field">
            <label className="auth-label">Nama</label>
            <div className="auth-input-wrapper">
              <input
                type="text"
                className={`auth-input ${submitted && !isNameValid ? 'error' : ''}`}
                placeholder="Masukkan nama"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 50))}
                maxLength={50}
                autoComplete="name"
              />
            </div>
            <span className="auth-char-count">{name.length}/50</span>
            {submitted && !isNameValid && (
              <span className="auth-field-error">Nama minimal 2 karakter</span>
            )}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                className={`auth-input ${submitted && !isValidEmail ? 'error' : ''}`}
                placeholder="contoh@email.com"
                value={email}
                onChange={e => setEmail(e.target.value.slice(0, 50))}
                maxLength={50}
                autoComplete="email"
              />
            </div>
            <span className="auth-char-count">{email.length}/50</span>
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
                className={`auth-input ${submitted && !isPasswordValid ? 'error' : ''}`}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value.slice(0, 20))}
                maxLength={20}
                autoComplete="new-password"
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
            <span className="auth-char-count">{password.length}/20</span>
            {submitted && !isPasswordValid && (
              <span className="auth-field-error">Password harus 6–20 karakter</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label">Konfirmasi Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`auth-input ${submitted && !passwordsMatch ? 'error' : ''}`}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value.slice(0, 20))}
                maxLength={20}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <Icon icon={showConfirm ? 'ph:eye-slash-duotone' : 'ph:eye-duotone'} />
              </button>
            </div>
            {submitted && !passwordsMatch && (
              <span className="auth-field-error">Password tidak cocok</span>
            )}
          </div>

          {/* Agreement Checkbox */}
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            <span className="auth-checkbox-text">
              Saya menyetujui ketentuan penggunaan dan kebijakan privasi
            </span>
          </label>

          <button type="submit" className="auth-submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Sudah punya akun? <Link to="/login">Masuk di sini</Link>
      </p>
    </div>
  )
}

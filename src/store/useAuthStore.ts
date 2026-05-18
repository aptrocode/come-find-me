import { create } from 'zustand'
import type { AuthUser } from '../types'

const TOKEN_KEY = 'fsm_token'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  register: (name: string, email: string, password: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        set({ error: data.error || 'Registrasi gagal', isLoading: false })
        return false
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
      return true
    } catch {
      set({ error: 'Gagal terhubung ke server', isLoading: false })
      return false
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        set({ error: data.error || 'Login gagal', isLoading: false })
        return false
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
      return true
    } catch {
      set({ error: 'Gagal terhubung ke server', isLoading: false })
      return false
    }
  },

  logout: async () => {
    const { token } = get()
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(token)
      })
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const { token } = get()
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders(token)
      })
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY)
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        return
      }
      const data = await res.json()
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null })
}))

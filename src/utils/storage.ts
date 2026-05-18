import type { PlayerState } from '../types'

const STORAGE_KEY = 'firstseeme_save'

export function saveGame(state: PlayerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    // Also sync to server database in background
    const token = localStorage.getItem('fsm_token')
    if (token) {
      fetch('/api/auth/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ saveData: state })
      }).catch(err => console.warn('Failed to sync save to server:', err))
    }
  } catch {
    console.warn('Failed to save game state')
  }
}

export function loadGame(): PlayerState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as PlayerState
  } catch {
    return null
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY)
}

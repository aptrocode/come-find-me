import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import AdminSectionCard from '../molecules/AdminSectionCard'
import type { AuthUser } from '../../types'

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      console.error('Failed to load users:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Hapus user "${email}"? Data tidak dapat dikembalikan.`)) return

    try {
      const res = await fetch(`/api/auth/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      }
    } catch (e) {
      console.error('Failed to delete user:', e)
    }
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminSectionCard
      title="User Management"
      icon="ph:users-duotone"
      badgeCount={users.length}
      actions={
        <Link
          to="/register"
          className="btn-add btn-mini"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <Icon icon="ph:user-plus-duotone" style={{ fontSize: '1rem' }} />
          Register / Add User
        </Link>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
          <Icon icon="ph:users-three-duotone" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }} />
          Belum ada user terdaftar
        </div>
      ) : (
        <div className="user-list">
          {users.map(user => (
            <div
              key={user.id}
              className="user-item"
              onClick={() => setSelectedUser(user)}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-item-avatar">
                <Icon icon="ph:user-circle-duotone" />
              </div>
              <div className="user-item-info">
                <span className="user-item-name">{user.name}</span>
                <span className="user-item-email">{user.email}</span>
                <span className="user-item-date">{formatDate(user.createdAt)}</span>
              </div>
              <button
                className="user-item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(user.id, user.email)
                }}
                title="Hapus user"
              >
                <Icon icon="ph:trash-duotone" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (() => {
        const p = selectedUser.saveData
        const level = p?.level ?? 1
        const totalCaught = p?.totalCaught ?? 0
        const totalSeen = p?.totalSeen ?? 0
        const xp = p?.xp ?? 0
        const inventory = p?.inventory ?? []

        return (
          <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">User Profile Details</h3>
                <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                  <Icon icon="ph:x-bold" />
                </button>
              </div>

              <div className="admin-modal-body">
                {/* User Bio */}
                <div className="admin-user-bio">
                  <div className="admin-user-avatar">
                    <Icon icon="ph:user-circle-duotone" />
                  </div>
                  <div className="admin-user-meta">
                    <h4 className="admin-user-name">{selectedUser.name}</h4>
                    <p className="admin-user-email">{selectedUser.email}</p>
                    <p className="admin-user-joined">Joined: {formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                {/* Game Stats */}
                <h4 className="admin-sub-title">Game Statistics</h4>
                <div className="admin-stats-grid">
                  <div className="admin-stat-item">
                    <Icon icon="ph:trophy-duotone" className="asi-icon" />
                    <span className="asi-val">Level {level}</span>
                    <span className="asi-lbl">Current Level</span>
                  </div>
                  <div className="admin-stat-item">
                    <Icon icon="ph:lightning-duotone" className="asi-icon" />
                    <span className="asi-val">{xp} XP</span>
                    <span className="asi-lbl">Total Experience</span>
                  </div>
                  <div className="admin-stat-item">
                    <Icon icon="ph:paw-print-duotone" className="asi-icon" />
                    <span className="asi-val">{totalCaught}</span>
                    <span className="asi-lbl">Total Caught</span>
                  </div>
                  <div className="admin-stat-item">
                    <Icon icon="ph:eye-duotone" className="asi-icon" />
                    <span className="asi-val">{totalSeen}</span>
                    <span className="asi-lbl">Total Seen</span>
                  </div>
                </div>

                {/* Collection / Inventory */}
                <h4 className="admin-sub-title" style={{ marginTop: '24px' }}>Creature Collection ({inventory.length})</h4>
                {inventory.length === 0 ? (
                  <div className="admin-empty-collection">
                    <Icon icon="ph:archive-duotone" style={{ fontSize: '1.8rem', opacity: 0.3 }} />
                    <p>No creatures caught yet</p>
                  </div>
                ) : (
                  <div className="admin-collection-list">
                    {inventory.map((item, idx) => (
                      <div key={item.id || idx} className="admin-collection-item">
                        <span className="aci-emoji">
                          {item.creature.emoji.startsWith('/') || item.creature.emoji.startsWith('http') || item.creature.emoji.includes('.') ? (
                            <img src={item.creature.emoji} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px', transform: `scale(${item.creature.iconScale ?? 1.0})` }} />
                          ) : (
                            <span style={{ display: 'inline-block', transform: `scale(${item.creature.iconScale ?? 1.0})` }}>{item.creature.emoji}</span>
                          )}
                        </span>
                        <div className="aci-info">
                          <span className="aci-name">{item.creature.name}</span>
                          <span className="aci-cp">CP {item.cp}</span>
                        </div>
                        <span className="aci-date">{new Date(item.caughtAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </AdminSectionCard>
  )
}

import { useState } from 'react'
import { Icon } from '@iconify/react'
import './ConfirmModal.css'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  type?: 'danger' | 'warning' | 'info'
  requireStrict?: boolean
  strictLabel?: string
  children?: React.ReactNode
  showCancel?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'danger',
  requireStrict = false,
  strictLabel = 'I understand this action is irreversible',
  children,
  showCancel = true
}: ConfirmModalProps) {
  const [isStrictChecked, setIsStrictChecked] = useState(false)

  if (!isOpen) return null

  const canConfirm = !requireStrict || isStrictChecked

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '440px', paddingBottom: '32px' }}
      >
        <div className="modal-header" style={{ 
          borderBottom: 'none', 
          padding: '24px 32px', /* Balanced padding */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: type === 'danger' ? 'var(--admin-warning)' : 'var(--admin-secondary)',
            fontSize: '1.2rem',
            margin: 0,
            lineHeight: 1
          }}>
            <Icon 
              icon={type === 'danger' ? "ph:warning-circle-duotone" : "ph:info-duotone"} 
              style={{ fontSize: '1.8rem', flexShrink: 0 }} 
            />
            <span>{title}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>
            <Icon icon="ph:x-bold" />
          </button>
        </div>

        <div className="confirm-modal-body" style={{ padding: '24px 32px' }}>
          <p style={{ 
            color: 'var(--admin-text-dim)', 
            lineHeight: '1.6',
            fontSize: '1rem',
            margin: 0
          }}>
            {description}
          </p>

          {children && (
            <div className="confirm-modal-extra" style={{ marginTop: '20px' }}>
              {children}
            </div>
          )}

          {requireStrict && (
            <label className="debug-toggle" style={{ 
              marginTop: '24px', 
              padding: '16px',
              border: '1px dashed var(--admin-warning)',
              background: 'rgba(255, 77, 77, 0.05)'
            }}>
              <input
                type="checkbox"
                checked={isStrictChecked}
                onChange={e => setIsStrictChecked(e.target.checked)}
                style={{ accentColor: 'var(--admin-warning)' }}
              />
              <span className="debug-label" style={{ fontSize: '0.85rem' }}>{strictLabel}</span>
            </label>
          )}
        </div>

        <div className="form-actions" style={{ 
          padding: '0 32px', 
          borderTop: 'none',
          marginTop: '8px'
        }}>
          {showCancel && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          )}
          <button 
            type="button" 
            className={`btn-primary ${type === 'danger' ? 'btn-danger' : ''}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              background: type === 'danger' ? 'var(--admin-warning)' : 'var(--admin-accent)',
              opacity: canConfirm ? 1 : 0.5,
              cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

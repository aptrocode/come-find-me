import React from 'react'
import { Icon } from '@iconify/react'
import './AdminSectionCard.css'

interface AdminSectionCardProps {
  title: string
  icon?: string
  logMode?: {
    checked: boolean
    onChange: (val: boolean) => void
  }
  onReset?: () => void
  resetLabel?: string
  actions?: React.ReactNode
  badgeCount?: number
  children: React.ReactNode
}

export default function AdminSectionCard({
  title,
  icon,
  logMode,
  onReset,
  resetLabel = 'Reset Defaults',
  actions,
  badgeCount,
  children
}: AdminSectionCardProps) {
  return (
    <div className="admin-section">
      <div className="section-header">
        <div className="section-title-group">
          {icon && <Icon icon={icon} className="section-icon" />}
          <h2>{title}</h2>
          {badgeCount !== undefined && (
            <span className="section-badge">{badgeCount}</span>
          )}
        </div>
        
        <div className="section-actions">
          {logMode && (
            <label className="debug-toggle">
              <input
                type="checkbox"
                checked={logMode.checked}
                onChange={e => logMode.onChange(e.target.checked)}
              />
              <span className="debug-label">Log Mode</span>
            </label>
          )}
          
          {onReset && (
            <button className="btn-secondary btn-mini" onClick={onReset}>
              <Icon icon="ph:arrows-counter-clockwise-bold" />
              {resetLabel}
            </button>
          )}
          
          {actions}
        </div>
      </div>
      
      <div className="section-content">
        {children}
      </div>
    </div>
  )
}

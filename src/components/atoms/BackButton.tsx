import React from 'react'
import { Icon } from '@iconify/react'

interface BackButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back', className = '' }) => {
  return (
    <button 
      onClick={onClick}
      className={`back-button ${className}`}
      aria-label="Go back"
    >
      <Icon icon="ph:caret-left-bold" />
      {label && <span>{label}</span>}

      <style>{`
        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 8px 16px 8px 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-4px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .back-button:active {
          transform: translateX(-4px) scale(0.95);
          background: rgba(255, 255, 255, 0.05);
        }

        .back-button svg {
          font-size: 1.2rem;
        }

        @media (max-width: 600px) {
          .back-button span {
            display: none;
          }
          .back-button {
            padding: 10px;
            border-radius: 50%;
            aspect-ratio: 1;
            width: 44px;
            height: 44px;
            justify-content: center;
          }
          .back-button:hover {
            transform: scale(1.1);
          }
        }
      `}</style>
    </button>
  )
}

export default BackButton

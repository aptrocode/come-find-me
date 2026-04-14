import './LoadingScreen.css'

interface Props {
  message: string
  isError?: boolean
}

export default function LoadingScreen({ message, isError }: Props) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {!isError && (
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-emoji">🌍</div>
          </div>
        )}
        {isError && <div className="error-icon">⚠️</div>}
        <h2 className="loading-title">{isError ? 'Oops!' : 'First See Mie'}</h2>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  )
}

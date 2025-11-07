import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  
  const { login, register, isLoading } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (!name.trim()) {
          setLocalError('Name is required')
          return
        }
        await register(email, password, name)
      }
      // Success - close modal
      onClose()
      setEmail('')
      setPassword('')
      setName('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed') //Authcontextista tuleva virheviesti. Määritellään backend/src/routes/auth.ts:ssa
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setLocalError(null)
    setEmail('')
    setPassword('')
    setName('')
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-header">
          <h2 className="modal-title">
            {isLogin ? 'Tervetuloa takaisin' : 'Luo tili'}
          </h2>
          <p className="modal-subtitle">
            {/* {isLogin ? 'vÄLIOTSIKKO' : 'Väliotsikko2'} */}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {localError && (
            <div className="form-error">
              {localError}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nimi</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Etunimi Sukunimi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Sähköposti</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="nimi@esimerkki.fi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Salasana</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="form-submit" disabled={isLoading}>
            {isLoading && <span className="loading-spinner" />}
            {isLogin ? 'Kirjaudu sisään' : 'Rekisteröidy'}
          </button>

          <div className="form-toggle">
            {isLogin ? 'Eikö sinulla ole tiliä? ' : 'Onko sinulla jo tili? '}
            <span className="form-toggle-link" onClick={toggleMode}>
              {isLogin ? 'Rekisteröidy' : 'Kirjaudu sisään'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

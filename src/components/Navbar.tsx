import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'
import { Button } from './Button'
import './Navbar.css'

export const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar__inner">
          <div className="navbar__brand">
            Sähköpörssi
            {/* TODO logo here */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ul className="nav-links">
              <li><a href="#">Etusivu</a></li>
              <li><a href="#about">Tietoa</a></li>
            </ul>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                  Hei, {user.name}
                </span>
                <Button variant="ghost" onClick={logout}>
                  Kirjaudu ulos
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAuthModalOpen(true)}>
                Kirjaudu sisään
              </Button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}

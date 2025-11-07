import { Link } from 'react-router-dom'
import './NotFound.css'

export const NotFound = () => {
  return (
    <main className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Sivua ei löytynyt</h2>
          <p className="not-found-text">
            Valitettavasti etsimääsi sivua ei ole olemassa.
          </p>
          <Link to="/" className="not-found-link">
            ← Palaa etusivulle
          </Link>
        </div>
      </div>
    </main>
  )
}

import './Navbar.css'

export const Navbar = () => {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__inner">
        <div className="navbar__brand">
          Sähköpörssi
          {/* TODO logo here */}
        </div>
        <ul className="nav-links">
          <li><a href="#">Etusivu</a></li>
          <li><a href="#about">Tietoa</a></li>
        </ul>
      </div>
    </nav>
  )
}
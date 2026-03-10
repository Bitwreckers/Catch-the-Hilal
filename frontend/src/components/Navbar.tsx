import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import jsLogo from '../assets/jslogo.png'

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.classList.add('nav-mobile-open')
    else document.body.classList.remove('nav-mobile-open')
    return () => document.body.classList.remove('nav-mobile-open')
  }, [mobileOpen])

  function closeMobile() {
    setMobileOpen(false)
  }

  async function handleLogout() {
    setOpen(false)
    setMobileOpen(false)
    await logout()
    navigate('/')
  }

  const navContent = (
    <>
      <NavLink to="/challenges" onClick={closeMobile}>Challenges</NavLink>
      <NavLink to="/scoreboard" onClick={closeMobile}>Scoreboard</NavLink>
      {user && (
        <>
          <NavLink to="/team" onClick={closeMobile}>Team</NavLink>
          <NavLink to="/users" onClick={closeMobile}>Users</NavLink>
        </>
      )}
      <NavLink to="/rules" onClick={closeMobile}>Rules</NavLink>
      <NavLink to="/announcements" onClick={closeMobile}>Announcements</NavLink>
    </>
  )

  return (
    <header className="nav-root">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={closeMobile}>
          <img src={jsLogo} alt="Catch the Hilal" className="nav-logo-img" />
          <span className="nav-logo-text">Catch the Hilal</span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          {navContent}
        </nav>
        <div className="nav-actions">
          {loading ? (
            <span className="nav-user-placeholder">…</span>
          ) : user ? (
            <div className="nav-user-wrap" ref={menuRef}>
              <button
                type="button"
                className="nav-user-btn"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="true"
              >
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-caret" aria-hidden>▼</span>
              </button>
              {open && (
                <div className="nav-user-menu" role="menu">
                  <Link to="/profile" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/settings" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
                    Settings
                  </Link>
                  <button type="button" className="nav-user-item nav-user-item-logout" role="menuitem" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="nav-btn nav-btn-ghost" onClick={closeMobile}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav-btn nav-btn-primary" onClick={closeMobile}>
                Register
              </NavLink>
            </>
          )}
        </div>
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </div>
      <div className="nav-mobile">
        <nav className="nav-mobile-links">
          {navContent}
        </nav>
        {!user && !loading && (
          <div className="nav-mobile-actions">
            <NavLink to="/login" className="nav-btn nav-btn-ghost" onClick={closeMobile}>
              Login
            </NavLink>
            <NavLink to="/register" className="nav-btn nav-btn-primary" onClick={closeMobile}>
              Register
            </NavLink>
          </div>
        )}
      </div>
    </header>
  )
}

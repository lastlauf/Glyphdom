import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

const SCRAMBLE_CHARS = '█▓▒░╬╫╪╩╨╧╦╥╤╣╢╡╠╟╞╝╜╛╚╙╘╗╖╕╔╓╒║═╏╎╍╌';

function scrambleTo(el, final, duration = 900) {
  if (!el) return;
  let start = null;
  const chars = SCRAMBLE_CHARS + final;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const revealed = Math.floor(p * final.length);
    el.textContent = final.split('').map((c, i) => {
      if (i < revealed) return c;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = final;
  }
  requestAnimationFrame(step);
}

export default function Navbar() {
  const location = useLocation();
  const logoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrambleTo(logoRef.current, 'ASCIIFORGE', 1100);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span ref={logoRef} className="logo-text">████████████</span>
      </Link>

      <div className="navbar-links">
        <Link
          to="/studio"
          className={`nav-link ${location.pathname === '/studio' ? 'active' : ''}`}
        >
          Studio
        </Link>
        <Link
          to="/gallery"
          className={`nav-link ${location.pathname === '/gallery' ? 'active' : ''}`}
        >
          Gallery
        </Link>
        <Link
          to="/editor"
          className={`nav-link ${location.pathname === '/editor' ? 'active' : ''}`}
        >
          Editor
        </Link>
        <Link to="/studio" className="nav-cta">
          Launch Studio
        </Link>
      </div>
    </nav>
  );
}

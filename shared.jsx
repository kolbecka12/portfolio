// Shared components: Topbar, MenuOverlay, ImageCell, Icons

function Logo({ size = 22, link = true }) {
  const el = (
    <span style={{ fontFamily: "var(--serif)", fontSize: size, letterSpacing: "0.02em", fontWeight: 400 }}>
      Andie Kolbeck
    </span>
  );
  return link ? <a href="#/" aria-label="Home">{el}</a> : el;
}

function MenuOverlay({ open, onClose, current }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const links = [
    { href: "#/",       label: "Home",   key: "home" },
    { href: "#/street", label: "Street", key: "street" },
    { href: "#/earth",  label: "Earth",  key: "earth" },
    { href: "#/diary",  label: "Diary",  key: "diary" },
    { href: "#/about",  label: "About",  key: "about" },
  ];
  return (
    <div className={"menu-overlay" + (open ? " open" : "")} onClick={onClose}>
      <button
        aria-label="Close menu"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "fixed", top: 28, right: 40, background: "none", border: "none",
          cursor: "pointer", padding: 0,
        }}
      >
        <div className="hamburger open"><span></span><span></span><span></span></div>
      </button>
      <nav onClick={(e) => e.stopPropagation()}>
        {links.map(l => (
          <a key={l.key} href={l.href} onClick={() => setTimeout(onClose, 50)}
             style={{
               fontStyle: current === l.key ? "italic" : "normal",
               color: current === l.key ? "var(--ink-muted)" : "var(--ink)",
             }}>
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Topbar({ crumb, current = null, showLogo = true, solid = false }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <React.Fragment>
      <header className="topbar" style={solid ? { background: "var(--bg)" } : {}}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {showLogo && (
            crumb ? (
              <span className="crumb">
                <a href="#/" style={{ fontStyle: "normal" }}>Andie Kolbeck</a>
                <span className="sep">›</span>
                {current ? <a href={`#/${current}`}><em>{crumb}</em></a> : <em>{crumb}</em>}
              </span>
            ) : <Logo />
          )}
        </div>
        <button className="hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <span></span><span></span><span></span>
        </button>
      </header>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} current={current} />
    </React.Fragment>
  );
}

// ImageCell with shimmer + lazy fade-in
function ImageCell({ src, alt = "", onClick, style = {}, className = "", aspect }) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div
      className={"img-shell " + (loaded ? "loaded " : "") + className}
      style={{ aspectRatio: aspect === "natural" ? undefined : aspect, cursor: onClick ? "pointer" : "default", ...style }}
      onClick={onClick}
    >
      <img
        src={src} alt={alt} loading="lazy" draggable={false}
        onLoad={() => setLoaded(true)}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 800ms ease",
          ...(aspect === "natural" ? { height: "auto", objectFit: "unset" } : {}),
        }}
      />
    </div>
  );
}

// Icons (line, simple)
const Icon = {
  Instagram: ({size = 22}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>
    </svg>
  ),
  Unsplash: ({size = 22}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M8 3h8v5H8z" />
      <path d="M3 11h6v3h6v-3h6v10H3z" />
    </svg>
  ),
  ArrowLeft: ({size = 28}) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M20 6 L10 16 L20 26" />
    </svg>
  ),
  ArrowRight: ({size = 28}) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M12 6 L22 16 L12 26" />
    </svg>
  ),
  Pencil: ({size = 16}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L20 8l-4-4L4 16z"/>
      <path d="M14 6l4 4"/>
    </svg>
  ),
  Close: ({size = 16}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 6 L18 18 M18 6 L6 18"/>
    </svg>
  ),
  Plus: ({size = 22}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M12 5v14 M5 12h14"/>
    </svg>
  ),
  Drag: ({size = 14}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="9" cy="6" r="0.6" fill="currentColor"/>
      <circle cx="15" cy="6" r="0.6" fill="currentColor"/>
      <circle cx="9" cy="12" r="0.6" fill="currentColor"/>
      <circle cx="15" cy="12" r="0.6" fill="currentColor"/>
      <circle cx="9" cy="18" r="0.6" fill="currentColor"/>
      <circle cx="15" cy="18" r="0.6" fill="currentColor"/>
    </svg>
  ),
};

// Use viewport size hook for responsive
function useViewport() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

Object.assign(window, { Logo, MenuOverlay, Topbar, ImageCell, Icon, useViewport });

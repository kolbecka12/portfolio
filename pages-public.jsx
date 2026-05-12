// Public pages: Home, Gallery, Lightbox, About

// ============================================================
// HOMEPAGE — left text links, right image, social icons bottom
// ============================================================
function HomePage({ tweaks }) {
  const nameRef = React.useRef(null);
  const photoRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const sync = () => {
      if (!nameRef.current || !photoRef.current) return;
      const nameWidth = nameRef.current.offsetWidth;
      const text = "Photography";
      // Reset to natural width before measuring
      photoRef.current.style.letterSpacing = "0";
      const natural = photoRef.current.offsetWidth;
      const extraPx = nameWidth - natural;
      // letter-spacing applies after each character (incl. last), so divide by length
      const perCharPx = extraPx / text.length;
      const fontSize = parseFloat(getComputedStyle(photoRef.current).fontSize);
      photoRef.current.style.letterSpacing = (perCharPx / fontSize) + "em";
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div className="page home-page" style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @media (max-width: 820px) {
          .home-grid { grid-template-columns: 1fr !important; }
          .home-hero { display: none !important; }
          .home-left { padding: 36px 28px !important; min-height: 100vh; position: relative; z-index: 1; }
          .home-page::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: url('home-photo.jpeg');
            background-size: cover;
            background-position: center;
            opacity: 0.25;
            pointer-events: none;
          }
          .home-studio-login { display: none !important; }
        }
      `}</style>
      <div
        className="home-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
          width: "100%", minHeight: "100vh"
        }}>
        
        {/* LEFT */}
        <div className="home-left" style={{
          padding: "56px 64px 48px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <div ref={nameRef} style={{
              fontFamily: "var(--serif)", fontSize: 22, letterSpacing: "0.02em",
              display: "table"
            }}>
              Andie Kolbeck
            </div>
            <div ref={photoRef} style={{
              fontFamily: "var(--sans)", fontSize: 11,
              textTransform: "uppercase", color: "var(--ink-muted)",
              marginTop: 6, display: "table"
            }}>
              Photography
            </div>
          </div>

          <nav className="home-links" style={{
            display: "flex", flexDirection: "column", gap: 6,
            marginTop: 40
          }}>
            {[
            { href: "#/street", label: "Street" },
            { href: "#/earth", label: "Earth" },
            { href: "#/diary", label: "Diary" },
            { href: "#/about", label: "About" }].
            map((l, i) =>
            <a key={l.href} href={l.href}
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(48px, 14vw, 108px)",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              transition: "color 200ms ease",
              display: "inline-block",
              color: "var(--ink)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.fontStyle = "normal";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.fontStyle = "italic";
            }}>
                {l.label}
              </a>
            )}
          </nav>

          <div className="home-social" style={{
            display: "flex", alignItems: "center", gap: 22,
            marginTop: 40
          }}>
            <a href="https://instagram.com/hello_kosmos" target="_blank" rel="noreferrer"
            aria-label="Instagram"
            style={{ color: "var(--ink-soft)", display: "inline-flex" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}>
              <Icon.Instagram />
            </a>
            <a href="https://unsplash.com/@kolbecka" target="_blank" rel="noreferrer"
            aria-label="Unsplash"
            style={{ color: "var(--ink-soft)", display: "inline-flex" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}>
              <Icon.Unsplash />
            </a>
            <span className="home-studio-login" style={{
              marginLeft: "auto",
              fontFamily: "var(--sans)", fontSize: 10, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--ink-muted)"
            }}>
              <a href="#/login">Studio Login</a>
            </span>
          </div>
        </div>

        {/* RIGHT — image */}
        <div className="home-hero" style={{
          position: "relative", overflow: "hidden",
          minHeight: "100vh"
        }}>
          <ImageCell
            src={HOMEPAGE_HERO}
            alt="Featured photograph"
            style={{ width: "100%", height: "100%", aspectRatio: "auto" }}
            className="img-fade" />
          
        </div>
      </div>
    </div>);

}

// ============================================================
// GALLERY PAGE — responsive 3/2/1 col w/ landscape spans
// ============================================================
function GalleryPage({ galleryKey, tweaks }) {
  const { images } = useStore();
  const list = images[galleryKey] || [];
  const meta = GALLERIES.find((g) => g.key === galleryKey);
  const w = useViewport();
  const cols = w >= 700 ? 2 : 1;

  const layout = (img) => {
    if (img.mode === "landscape") return { span: cols, aspect: "natural" };
    return { span: 1, aspect: "3 / 4" }; // portrait
  };

  return (
    <div className="page">
      <Topbar crumb={meta.label} current={galleryKey} solid />
      <style>{`
        .gallery-main { padding: 96px 40px 80px; }
        @media (max-width: 600px) { .gallery-main { padding: 96px 16px 80px; } }
      `}</style>
      <main className="gallery-main">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: "var(--gap)",
          gridAutoFlow: "dense"
        }}>
          {list.map((img, i) => {
            const { span, aspect } = layout(img);
            return (
              <a
                key={img.id}
                href={`#/photo/${galleryKey}/${img.id}`}
                style={{
                  gridColumn: `span ${span}`,
                  display: "block",
                  position: "relative",
                  animation: `imgIn 1100ms ease both`,
                  animationDelay: `${Math.min(i, 8) * 60}ms`
                }}
                onMouseEnter={(e) => {
                  const cap = e.currentTarget.querySelector(".cap");
                  if (cap) cap.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  const cap = e.currentTarget.querySelector(".cap");
                  if (cap) cap.style.opacity = 0;
                }}>
                
                <ImageCell src={img.src} alt={img.caption} aspect={aspect} />
                <div className="cap" style={{
                  position: "absolute", left: 16, bottom: 14, right: 16,
                  fontFamily: "var(--serif)", fontStyle: "normal",
                  fontSize: 16, color: "#fff",
                  textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                  textAlign: "center",
                  opacity: 0, transition: "opacity 300ms ease",
                  pointerEvents: "none"
                }}>
                  {img.caption}
                </div>
              </a>);

          })}
        </div>

        <footer style={{
          marginTop: 80, paddingTop: 32, borderTop: "1px solid var(--rule)",
          display: "flex", justifyContent: "flex-end",
          fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
          textTransform: "uppercase", color: "var(--ink-muted)"
        }}>
          <span>© Andie Kolbeck 2026</span>
        </footer>
        </div>
      </main>
    </div>);

}

// ============================================================
// LIGHTBOX PAGE — letterbox single image with L/R, swipe, breadcrumbs
// ============================================================
function LightboxPage({ galleryKey, photoId }) {
  const { images } = useStore();
  const list = images[galleryKey] || [];
  const meta = GALLERIES.find((g) => g.key === galleryKey);
  const idx = list.findIndex((i) => i.id === photoId);
  const img = list[idx];
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  const go = (target) => {
    if (target) window.location.hash = `#/photo/${galleryKey}/${target.id}`;
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(prev);
      if (e.key === "ArrowRight") go(next);
      if (e.key === "Escape") window.location.hash = `#/${galleryKey}`;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, galleryKey]);

  // Touch swipe
  const touch = React.useRef({ x: 0 });
  const onTouchStart = (e) => {touch.current.x = e.touches[0].clientX;};
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    if (dx > 60) go(prev);else
    if (dx < -60) go(next);
  };

  if (!img) {
    return (
      <div className="page" style={{ padding: 80 }}>
        <Topbar crumb={meta?.label} current={galleryKey} />
        <p style={{ marginTop: 100, fontStyle: "italic", color: "var(--ink-muted)" }}>
          That photograph couldn’t be found. <a href={`#/${galleryKey}`} style={{ borderBottom: "1px solid currentColor" }}>Back to {meta?.label}</a>.
        </p>
      </div>);

  }

  return (
    <div className="page" style={{ background: "var(--bg)", minHeight: "100vh" }}
    onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Topbar crumb={meta.label} current={galleryKey} />

      <style>{`
        @media (max-width: 600px) {
          .lightbox-img { width: 100% !important; max-height: calc(100vh - 200px) !important; box-shadow: none !important; }
        }
      `}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        paddingTop: 92, paddingBottom: 48,
        gap: 16,
      }}>
        {/* < ##/## > above photo */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button aria-label="Previous" onClick={() => go(prev)}
            style={lightboxArrowStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}>
            <Icon.ArrowLeft />
          </button>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--ink-muted)",
            minWidth: 60, textAlign: "center",
          }}>
            {String(idx + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </div>
          <button aria-label="Next" onClick={() => go(next)}
            style={lightboxArrowStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}>
            <Icon.ArrowRight />
          </button>
        </div>

        {/* Photo */}
        <img
          key={img.id}
          src={img.src}
          alt={img.caption}
          className="img-fade lightbox-img"
          style={{
            maxWidth: "100%", maxHeight: "calc(100vh - 280px)",
            objectFit: "contain",
            boxShadow: "0 6px 40px rgba(20,18,14,0.06)"
          }} />

        {/* Caption */}
        <div style={{
          fontFamily: "var(--serif)", fontStyle: "normal", fontSize: 15,
          color: "var(--ink-soft)", textAlign: "center",
        }}>
          {img.caption}
        </div>
      </div>
    </div>);

}

const lightboxArrowStyle = {
  background: "transparent", border: "none", cursor: "pointer",
  color: "var(--ink-soft)", padding: 8,
  transition: "color 200ms ease",
};

// ============================================================
// ABOUT PAGE — text left, image right, top nav present
// ============================================================
function AboutPage() {
  return (
    <div className="page" style={{ minHeight: "100vh" }}>
      <Topbar current="about" solid />
      <main style={{ minHeight: "100vh" }}>
        <style>{`
          @media (max-width: 820px) {
            .about-grid { grid-template-columns: 1fr !important; }
            .about-image { height: 50vh !important; min-height: 50vh !important; order: -1; }
            .about-image img { object-position: top; }
            .about-text { padding: 40px 28px 60px 28px !important; }
          }
        `}</style>
        <div className="about-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          width: "100%", minHeight: "100vh"
        }}>
          <section className="about-text" style={{
            padding: "140px 80px 60px 40px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            maxWidth: 720
          }}>
            <h1 style={{
              fontFamily: "var(--serif)", fontWeight: 400,
              fontSize: "clamp(42px, 5vw, 72px)",
              letterSpacing: "-0.01em", lineHeight: 1.05,
              margin: "0 0 32px"
            }}>
              <em style={{ color: "var(--ink-muted)" }}>About</em>
            </h1>
            <p style={{
              fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.55,
              color: "var(--ink-soft)", textWrap: "pretty", margin: "0 0 32px"
            }}>
              Since forever I have been obsessed with remembering things, and photography is a natural remedy for this illness.
            </p>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 15, lineHeight: 1.65,
              color: "var(--ink-soft)", textWrap: "pretty",
              display: "flex", flexDirection: "column", gap: 14
            }}>
              <p style={{ margin: 0 }}>
                Like a visual diary of my life, I often feel a compulsive urge to capture details, somehow proving to myself and the world that they once occurred, that I existed, here in this moment and place: whether it's the view from the backseat window on a long drive through rural Washington State, a train platform packed with gloriously fashionable commuters at Farringdon Station, or sharp solstice shadows marking the ground on a very average December day in Kreuzberg.
              </p>
              <p style={{ margin: 0 }}>
                I'm forever entranced by hazy, dream-like scenes that shimmer with nostalgia; sunlit reflections in glass crafting unintentional double exposures; and slow-motion scenes of decay, where nettles and ivy are quietly eating the corpse of some forgotten building one brick at a time.
              </p>
              <p style={{ margin: 0 }}>
                I will probably keep doing this until I die and the nettles come for me too.
              </p>
              <p style={{ margin: 0 }}>&nbsp;</p>
              <p style={{ margin: 0 }}>
                See my product design work at <a href="https://www.andiekolbeck.com" target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>andiekolbeck.com</a>.
              </p>
            </div>

            <div style={{
              marginTop: 56,
              display: "flex", gap: 20, alignItems: "center",
            }}>
              <a href="https://instagram.com/hello_kosmos" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", color: "var(--ink-soft)" }}>
                <Icon.Instagram size={18} />
              </a>
              <a href="https://unsplash.com/@kolbecka" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", color: "var(--ink-soft)" }}>
                <Icon.Unsplash size={18} />
              </a>
              <span style={{ width: 1, height: 14, background: "var(--rule)" }}></span>
              <span style={{
                fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--ink-muted)"
              }}>Based in Berlin, Germany</span>
            </div>
          </section>

          <section className="about-image" style={{
            position: "relative", overflow: "hidden", minHeight: "100vh"
          }}>
            <ImageCell
              src="about-photo.jpg"
              alt="Andie Kolbeck portrait"
              style={{ width: "100%", height: "100%", aspectRatio: "auto" }}
              className="img-fade" />
            
          </section>
        </div>
      </main>
    </div>);

}

Object.assign(window, { HomePage, GalleryPage, LightboxPage, AboutPage });
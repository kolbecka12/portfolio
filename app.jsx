// Main app — hash router + Tweaks panel + mounting

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typePairing": "playfair",
  "gridDensity": "airy",
  "theme": "light",
  "showTrueLightbox": true
}/*EDITMODE-END*/;

function App() {
  const { path } = useHashRoute();
  const { auth } = useStore();
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply type pairing via CSS vars
  React.useEffect(() => {
    const map = {
      playfair:  '"Playfair Display", Georgia, serif',
      cormorant: '"Cormorant Garamond", "EB Garamond", Georgia, serif',
      ebgaramond: '"EB Garamond", Georgia, serif',
      libre:     '"Libre Caslon Text", Georgia, serif',
    };
    document.documentElement.style.setProperty("--serif", map[tweaks.typePairing] || map.playfair);
  }, [tweaks.typePairing]);

  React.useEffect(() => {
    const gap = { tight: "8px", airy: "18px", generous: "32px" }[tweaks.gridDensity] || "18px";
    document.documentElement.style.setProperty("--gap", gap);
  }, [tweaks.gridDensity]);

  // Apply theme — light, umber (deep), truffle (lighter charcoal-brown)
  React.useEffect(() => {
    const themes = {
      light: {
        "--bg":        "#fdfdfb",
        "--ink":       "#16140f",
        "--ink-soft":  "#4a4640",
        "--ink-muted": "#8a857c",
        "--rule":      "#e7e3db",
        "--shell":     "#efece6",
        "--card":      "#ffffff",
      },
      // Umber — deep, near-black warm brown. Crisp, high-contrast.
      umber: {
        "--bg":        "#16100a",  // very dark, almost coffee-black
        "--ink":       "#f5ecdb",  // warm cream — 16.5:1 (AAA)
        "--ink-soft":  "#c9bda6",  // ~9.7:1 (AAA)
        "--ink-muted": "#8a7e6a",  // ~4.9:1 (AA)
        "--rule":      "#2e2519",
        "--shell":     "#221a11",
        "--card":      "#1c1610",
      },
      // Truffle — softer, warmer, mid-brown. Moodier, tobacco-leaning.
      truffle: {
        "--bg":        "#3a2f25",  // notably lighter, more saturated brown
        "--ink":       "#f0d9b8",  // sandy cream w/ rose tint — ~9.6:1 (AAA)
        "--ink-soft":  "#d4b78d",  // ~6.9:1 (AAA)
        "--ink-muted": "#a08566",  // ~4.6:1 (AA)
        "--rule":      "#5a4a3a",
        "--shell":     "#48392c",
        "--card":      "#43362a",
      },
    };
    const t = themes[tweaks.theme] || themes.light;
    Object.entries(t).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, [tweaks.theme]);

  // Routing
  let view = null;
  const isGallery = (k) => GALLERIES.find(g => g.key === k);

  if (path.length === 0) {
    view = <HomePage tweaks={tweaks} />;
  } else if (path[0] === "about") {
    view = <AboutPage />;
  } else if (path[0] === "login") {
    view = <LoginPage />;
  } else if (path[0] === "admin") {
    if (!auth) {
      // gate
      window.location.hash = "#/login";
      return null;
    }
    if (path.length === 1) view = <AdminPickerPage />;
    else if (isGallery(path[1])) view = <AdminManagePage galleryKey={path[1]} />;
    else { window.location.hash = "#/admin"; return null; }
  } else if (path[0] === "photo" && path.length === 3) {
    view = <LightboxPage galleryKey={path[1]} photoId={path[2]} />;
  } else if (isGallery(path[0])) {
    view = <GalleryPage galleryKey={path[0]} tweaks={tweaks} />;
  } else {
    // unknown — back to home
    window.location.hash = "#/";
    return null;
  }

  return (
    <React.Fragment>
      {view}
      <PortfolioTweaks tweaks={tweaks} setTweak={setTweak} />
    </React.Fragment>
  );
}

function PortfolioTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <TweakRadio
          label="Mode"
          value={tweaks.theme}
          onChange={(v) => setTweak("theme", v)}
          options={["light", "umber", "truffle"]}
        />
      </TweakSection>
      <TweakSection label="Typography">
        <TweakRadio
          label="Display Serif"
          value={tweaks.typePairing}
          onChange={(v) => setTweak("typePairing", v)}
          options={["cormorant", "ebgaramond", "libre"]}
        />
      </TweakSection>
      <TweakSection label="Grid">
        <TweakRadio
          label="Padding"
          value={tweaks.gridDensity}
          onChange={(v) => setTweak("gridDensity", v)}
          options={["tight", "airy", "generous"]}
        />
      </TweakSection>
      <TweakSection label="Quick links">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Home",          "#/"],
            ["Street",        "#/street"],
            ["Earth",         "#/earth"],
            ["Diary",         "#/diary"],
            ["Lightbox demo", "#/photo/earth/e1"],
            ["About",         "#/about"],
            ["Studio Login",  "#/login"],
            ["Studio admin",  "#/admin"],
          ].map(([label, href]) => (
            <a key={href} href={href}
              style={{
                fontSize: 11, color: "rgba(41,38,27,.72)",
                padding: "4px 0",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                textDecoration: "none",
              }}>
              {label}
            </a>
          ))}
        </div>
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

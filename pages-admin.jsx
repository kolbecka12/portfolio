// Admin pages: Login, Picker, Manage (Pinterest-style with drag/edit/delete), Upload modal

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage() {
  const [email, setEmail] = React.useState("andie@studio.com");
  const [pw, setPw] = React.useState("");
  const [shake, setShake] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email || !pw) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    Store.login();
    window.location.hash = "#/admin";
  };

  return (
    <div className="page" style={{
      minHeight: "100vh",
      display: "grid", placeItems: "center",
      padding: 24,
    }}>
      <style>{`
        @keyframes shakeX { 0%,100% { transform: translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }
        .shake { animation: shakeX 300ms ease; }
      `}</style>

      <a href="#/" style={{
        position: "fixed", top: 28, left: 40,
        fontFamily: "var(--serif)", fontSize: 22,
      }}>Andie Kolbeck</a>

      <form onSubmit={submit} className={shake ? "shake" : ""}
        style={{
          width: "100%", maxWidth: 380,
          display: "flex", flexDirection: "column", gap: 28,
        }}>
        <div>
          <h1 style={{
            fontFamily: "var(--serif)", fontWeight: 400,
            fontSize: 44, margin: 0, letterSpacing: "-0.01em",
          }}>
            <em style={{color: "var(--ink-muted)"}}>Studio</em> Login
          </h1>
          <p style={{
            fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--ink-muted)",
            marginTop: 10,
          }}>For Andie only — manage galleries</p>
        </div>

        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="any password works" />
        </div>

        <button type="submit" className="btn" style={{ alignSelf: "flex-start" }}>
          Enter Studio
        </button>

        <a href="#/" style={{
          fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
          textTransform: "uppercase", color: "var(--ink-muted)",
        }}>← Back to site</a>
      </form>
    </div>
  );
}

// ============================================================
// Upload via Cloudflare Worker (token lives server-side)
// After deploying upload-worker/worker.js, paste your worker URL here:
// ============================================================
const UPLOAD_WORKER_URL = "/.netlify/functions/upload";

async function uploadViaWorker(gallery, file) {
  if (!UPLOAD_WORKER_URL) throw new Error("UPLOAD_WORKER_URL not configured");
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const resp = await fetch(UPLOAD_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gallery, filename: file.name, content: base64 }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Upload error ${resp.status}`);
  return data.url;
}

// ============================================================
// ADMIN PICKER — choose Earth / Street / Diary
// ============================================================
function AdminPickerPage() {
  const { images } = useStore();
  return (
    <div className="page" style={{ minHeight: "100vh" }}>
      <AdminTopbar />
      <main style={{ padding: "120px 56px 80px", maxWidth: 1400, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--ink-muted)",
          }}>Studio</div>
          <h1 style={{
            fontFamily: "var(--serif)", fontWeight: 400,
            fontSize: "clamp(42px, 5vw, 64px)",
            margin: "8px 0 0", letterSpacing: "-0.01em",
          }}>
            Which gallery would you like to <em>manage</em>?
          </h1>
        </header>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}>
          {GALLERIES.map(g => (
            <a key={g.key} href={`#/admin/${g.key}`}
              style={{
                display: "block", textDecoration: "none", color: "inherit",
                background: "#fff", border: "1px solid var(--rule)",
                padding: 28, transition: "border-color 200ms ease, transform 300ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--ink)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--rule)";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              <div style={{
                aspectRatio: "4 / 3",
                marginBottom: 18,
                overflow: "hidden",
              }}>
                <ImageCell
                  src={images[g.key][0]?.src}
                  aspect="4 / 3"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <h2 style={{
                  fontFamily: "var(--serif)", fontWeight: 400,
                  fontSize: 36, margin: 0, letterSpacing: "-0.01em",
                }}>{g.label}</h2>
                <span style={{
                  fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "var(--ink-muted)",
                }}>
                  {images[g.key].length} photos
                </span>
              </div>
              <p style={{
                fontFamily: "var(--serif)", fontStyle: "italic",
                fontSize: 16, color: "var(--ink-soft)", margin: "10px 0 0",
              }}>{g.blurb}</p>
            </a>
          ))}
        </div>

      </main>
    </div>
  );
}

// ============================================================
// ADMIN MANAGE — Pinterest-style grid w/ drag, edit, delete, upload
// ============================================================
function AdminManagePage({ galleryKey }) {
  const { images } = useStore();
  const list = images[galleryKey] || [];
  const meta = GALLERIES.find(g => g.key === galleryKey);
  const [editing, setEditing] = React.useState(null); // image id
  const [showUpload, setShowUpload] = React.useState(false);
  const [dragId, setDragId] = React.useState(null);
  const [dragOverId, setDragOverId] = React.useState(null);
  const w = useViewport();
  const cols = w >= 1100 ? 3 : w >= 700 ? 2 : 1;

  const layout = (img) => {
    if (img.mode === "landscape") return { span: cols, aspect: "natural" };
    if (img.mode === "square") return { span: Math.min(2, cols), aspect: "1 / 1" };
    return { span: 1, aspect: "3 / 4" };
  };

  if (!meta) return null;

  const onDragStart = (id) => (e) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    // ghost
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (id) => (e) => { e.preventDefault(); setDragOverId(id); };
  const onDrop = (id) => (e) => {
    e.preventDefault();
    if (dragId && dragId !== id) Store.reorder(galleryKey, dragId, id);
    setDragId(null); setDragOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setDragOverId(null); };

  return (
    <div className="page" style={{ minHeight: "100vh", paddingBottom: 120 }}>
      <AdminTopbar crumb={meta.label} solid />
      <main style={{ padding: "112px 32px 80px" }}>
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 28, padding: "0 8px",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--ink-muted)",
            }}>
              <a href="#/admin">Studio</a> &nbsp;›&nbsp; {meta.label}
            </div>
            <h1 style={{
              fontFamily: "var(--serif)", fontWeight: 400,
              fontSize: "clamp(36px, 4vw, 52px)",
              margin: "6px 0 0", letterSpacing: "-0.01em",
            }}>
              <em>{meta.label}</em> &nbsp;<span style={{ color: "var(--ink-muted)" }}>· {list.length}</span>
            </h1>
          </div>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--ink-muted)",
          }}>
            Drag to reorder &nbsp;·&nbsp; Hover to edit
          </div>
        </header>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: "var(--gap)",
          gridAutoFlow: "dense",
        }}>
          {list.map((img, i) => {
            const { span, aspect } = layout(img);
            return (
              <ManageCard
                key={img.id}
                img={img}
                span={span}
                aspect={aspect}
                isDragging={dragId === img.id}
                isDropTarget={dragOverId === img.id && dragId !== img.id}
                onDragStart={onDragStart(img.id)}
                onDragOver={onDragOver(img.id)}
                onDrop={onDrop(img.id)}
                onDragEnd={onDragEnd}
                onEdit={() => setEditing(img.id)}
                onDelete={() => {
                  if (confirm(`Delete "${img.caption}"?`)) {
                    Store.deleteImage(galleryKey, img.id);
                  }
                }}
              />
            );
          })}
        </div>

        {list.length === 0 && (
          <div style={{
            textAlign: "center", padding: "100px 20px",
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 22, color: "var(--ink-muted)",
          }}>
            No photographs yet. Tap the + below to add one.
          </div>
        )}
      </main>

      {/* Floating + button */}
      <button
        aria-label="Upload new image"
        onClick={() => setShowUpload(true)}
        style={{
          position: "fixed", bottom: 36, left: "50%", transform: "translateX(-50%)",
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--ink)", color: "var(--bg)",
          border: "none", cursor: "pointer",
          display: "grid", placeItems: "center",
          boxShadow: "0 12px 40px rgba(20,18,14,0.25)",
          zIndex: 30,
          transition: "transform 200ms ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(1.06)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(1)"}
      >
        <Icon.Plus size={26} />
      </button>

      {/* Edit modal */}
      {editing && (
        <EditModal
          galleryKey={galleryKey}
          img={list.find(i => i.id === editing)}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          galleryKey={galleryKey}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// ManageCard — single image in the admin board
// ============================================================
function ManageCard({ img, span, aspect, onDragStart, onDragOver, onDrop, onDragEnd, onEdit, onDelete, isDragging, isDropTarget }) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: `span ${span}`,
        position: "relative",
        opacity: isDragging ? 0.35 : 1,
        outline: isDropTarget ? "2px solid var(--ink)" : "none",
        outlineOffset: 2,
        transition: "opacity 150ms ease",
        cursor: "grab",
      }}
    >
      <ImageCell src={img.src} alt={img.caption} aspect={aspect} />

      {/* Hover overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: hover ? "rgba(20,18,14,0.18)" : "transparent",
        transition: "background 200ms ease",
        pointerEvents: "none",
      }} />

      {/* Top-right action buttons */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        display: "flex", gap: 6,
        opacity: hover ? 1 : 0,
        transform: hover ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
          aria-label="Edit"
          style={cardActionBtn}>
          <Icon.Pencil />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete"
          style={cardActionBtn}>
          <Icon.Close />
        </button>
      </div>

      {/* Caption + mode tag (always visible, subtle) */}
      <div style={{
        position: "absolute", bottom: 8, left: 8, right: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: hover ? 1 : 0,
        transition: "opacity 200ms ease",
        pointerEvents: "none",
      }}>
        <span style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
          color: "#fff", textShadow: "0 1px 5px rgba(0,0,0,.4)",
          maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{img.caption}</span>
        <span style={{
          fontFamily: "var(--sans)", fontSize: 9, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "#fff",
          background: "rgba(0,0,0,0.4)", padding: "3px 7px",
        }}>{img.mode}</span>
      </div>

      {/* Drag handle hint top-left */}
      <div style={{
        position: "absolute", top: 8, left: 8,
        opacity: hover ? 0.85 : 0,
        transition: "opacity 200ms ease",
        background: "rgba(255,255,255,0.92)",
        color: "var(--ink)",
        padding: "4px 6px",
        pointerEvents: "none",
      }}>
        <Icon.Drag />
      </div>
    </div>
  );
}

const cardActionBtn = {
  background: "rgba(255,255,255,0.95)",
  color: "var(--ink)",
  border: "none",
  width: 30, height: 30,
  display: "grid", placeItems: "center",
  cursor: "pointer",
  transition: "background 150ms ease",
};

// ============================================================
// EditModal & UploadModal
// ============================================================
function EditModal({ galleryKey, img, onClose }) {
  if (!img) return null;
  const update = (patch) => Store.updateImage(galleryKey, img.id, patch);

  return (
    <Modal title="Edit photograph" onClose={onClose} subtitle="Changes save automatically">
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28 }}>
        <div>
          <ImageCell src={img.src} aspect="3 / 4" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="field">
            <label>Caption</label>
            <input
              defaultValue={img.caption}
              onChange={(e) => update({ caption: e.target.value })}
            />
          </div>
          <ModeSelect value={img.mode} onChange={(mode) => update({ mode })} />
        </div>
      </div>
    </Modal>
  );
}

function UploadModal({ galleryKey, onClose }) {
  const [draft, setDraft] = React.useState({
    src: "",
    caption: "",
    mode: "portrait",
  });
  const [filePreview, setFilePreview] = React.useState(null);
  const [uploadStatus, setUploadStatus] = React.useState(null); // null | "uploading" | "done" | "error"
  const [uploadError, setUploadError] = React.useState("");
  const fileRef = React.useRef(null);
  const idRef = React.useRef(null);

  const ensureSaved = (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (!next.src) return;
    if (!idRef.current) {
      const id = "u" + Math.random().toString(36).slice(2, 8);
      idRef.current = id;
      Store.addImage(galleryKey, {
        id, src: next.src, caption: next.caption || "Untitled", mode: next.mode,
      });
    } else {
      Store.updateImage(galleryKey, idRef.current, {
        src: next.src,
        caption: next.caption || "Untitled",
        mode: next.mode,
      });
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Show local preview immediately
    setFilePreview(URL.createObjectURL(f));

    if (UPLOAD_WORKER_URL) {
      setUploadStatus("uploading");
      setUploadError("");
      try {
        const url = await uploadViaWorker(galleryKey, f);
        setUploadStatus("done");
        ensureSaved({ src: url });
      } catch (err) {
        setUploadStatus("error");
        setUploadError(err.message || "Upload failed");
        // Fall back to base64 so the photo isn't lost
        const reader = new FileReader();
        reader.onload = (ev) => ensureSaved({ src: ev.target.result });
        reader.readAsDataURL(f);
      }
    } else {
      // Worker not configured — store as base64 (browser only)
      const reader = new FileReader();
      reader.onload = (ev) => ensureSaved({ src: ev.target.result });
      reader.readAsDataURL(f);
    }
  };

  const statusLabel = () => {
    if (uploadStatus === "uploading") return "⟳ Uploading to GitHub…";
    if (uploadStatus === "done") return "● Saved to GitHub · " + galleryKey;
    if (uploadStatus === "error") return "✕ " + uploadError + " (saved locally as fallback)";
    if (idRef.current && !UPLOAD_WORKER_URL) return "● Saved in browser only · " + galleryKey;
    if (idRef.current) return "● Saved to " + galleryKey;
    return "○ Waiting for image";
  };

  const statusColor = () => {
    if (uploadStatus === "error") return "#b04040";
    if (uploadStatus === "uploading") return "var(--ink-muted)";
    return idRef.current ? "var(--ink)" : "var(--ink-muted)";
  };

  const subtitle = () => {
    if (uploadStatus === "uploading") return "Uploading…";
    if (idRef.current) return "Saved · changes auto-save";
    return "Pick an image to begin";
  };

  return (
    <Modal title="Upload photograph" onClose={onClose} subtitle={subtitle()}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28 }}>
        <div>
          <div
            onClick={() => uploadStatus !== "uploading" && fileRef.current?.click()}
            style={{
              aspectRatio: "3 / 4",
              border: "1px dashed var(--rule)",
              display: "grid", placeItems: "center",
              cursor: uploadStatus === "uploading" ? "wait" : "pointer",
              background: filePreview || draft.src ? "transparent" : "#faf8f3",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {(filePreview || draft.src) ? (
              <img src={filePreview || draft.src} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{
                textAlign: "center", color: "var(--ink-muted)",
                fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}>
                <div style={{ fontSize: 28, color: "var(--ink-soft)", marginBottom: 8, fontFamily: "var(--serif)" }}>+</div>
                Click to choose<br/>or paste a URL
              </div>
            )}
            {uploadStatus === "uploading" && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(253,253,251,0.7)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--ink)",
              }}>
                Uploading…
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile}
            style={{ display: "none" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="field">
            <label>Image URL <span style={{ textTransform: "none", color: "var(--ink-muted)" }}>(or use the file picker)</span></label>
            <input
              type="url" value={draft.src.startsWith("data:") ? "" : draft.src}
              onChange={(e) => ensureSaved({ src: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="field">
            <label>Caption</label>
            <input value={draft.caption}
              onChange={(e) => ensureSaved({ caption: e.target.value })}
              placeholder="A short note…" />
          </div>
          <ModeSelect value={draft.mode} onChange={(mode) => ensureSaved({ mode })} />

          <div style={{
            marginTop: 6,
            fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: statusColor(),
          }}>
            {statusLabel()}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ModeSelect({ value, onChange }) {
  const opts = [
    { v: "portrait",  label: "Portrait",  hint: "1 column · 3:4" },
    { v: "square",    label: "Square",    hint: "2 cols on desktop · 1:1" },
    { v: "landscape", label: "Landscape", hint: "Full width · 3:2" },
  ];
  return (
    <div className="field">
      <label>Display</label>
      <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
        {opts.map(o => (
          <label key={o.v}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              border: "1px solid " + (value === o.v ? "var(--ink)" : "var(--rule)"),
              cursor: "pointer",
              transition: "border-color 200ms ease, background 200ms ease",
              background: value === o.v ? "#faf8f3" : "transparent",
            }}>
            <input type="radio" name="mode"
              checked={value === o.v}
              onChange={() => onChange(o.v)}
              style={{ accentColor: "#16140f" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 17 }}>{o.label}</span>
              <span style={{
                fontFamily: "var(--sans)", fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--ink-muted)",
              }}>{o.hint}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Modal shell
// ============================================================
function Modal({ title, subtitle, children, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(20,18,14,0.45)",
        display: "grid", placeItems: "center",
        padding: 24,
        animation: "modalBgIn 280ms ease both",
      }}
    >
      <style>{`
        @keyframes modalBgIn { from { opacity:0;} to { opacity:1;} }
        @keyframes modalIn { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          padding: "32px 36px",
          width: "100%", maxWidth: 720,
          maxHeight: "90vh", overflow: "auto",
          animation: "modalIn 320ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 28,
        }}>
          <div>
            <h2 style={{
              fontFamily: "var(--serif)", fontWeight: 400,
              fontSize: 30, margin: 0, letterSpacing: "-0.01em",
            }}>{title}</h2>
            {subtitle && (
              <p style={{
                fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "var(--ink-muted)",
                margin: "6px 0 0",
              }}>{subtitle}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink-soft)", padding: 4,
            }}>
            <Icon.Close size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Admin top bar (separate so it has logout)
// ============================================================
function AdminTopbar({ crumb, solid = false }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <React.Fragment>
      <header className="topbar" style={solid ? { background: "var(--bg)" } : {}}>
        <div>
          {crumb ? (
            <span className="crumb">
              <a href="#/admin">Studio</a>
              <span className="sep">›</span>
              <em>{crumb}</em>
            </span>
          ) : (
            <span className="crumb">
              <a href="#/">Andie Kolbeck</a>
              <span className="sep">›</span>
              <em>Studio</em>
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <button
            onClick={() => { Store.logout(); window.location.hash = "#/"; }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--ink-muted)",
              padding: "8px 4px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-muted)"}>
            Sign out
          </button>
          <button className="hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </React.Fragment>
  );
}

Object.assign(window, { LoginPage, AdminPickerPage, AdminManagePage, AdminTopbar });

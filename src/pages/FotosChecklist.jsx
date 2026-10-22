import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { folioVisible } from "../utils/folio";
import logo from "../assets/logo.png";

const BUCKET = "checklist-fotos";

export default function FotosChecklist() {
  const { token } = useParams();
  const [datos, setDatos] = useState(undefined);
  const [idx, setIdx] = useState(null); // índice de foto activa en el visor
  const toqueX = useRef(null);

  useEffect(() => {
    let vivo = true;
    supabase.rpc("checklist_fotos_publico", { p_token: token }).then(({ data, error }) => {
      if (vivo) setDatos(error ? null : data || null);
    });
    return () => { vivo = false; };
  }, [token]);

  const fotos = datos?.fotos || [];
  const urlDe = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const irA = useCallback((n) => {
    setIdx((prev) => (prev === null ? null : (n + fotos.length) % fotos.length));
  }, [fotos.length]);

  useEffect(() => {
    if (idx === null) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") irA(idx + 1);
      if (e.key === "ArrowLeft") irA(idx - 1);
      if (e.key === "Escape") setIdx(null);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [idx, irA]);

  if (datos === undefined) {
    return (
      <div className="fk-pagina">
        <Estilos />
        <Barra />
        <div className="fk-centro">
          <div className="fk-spinner" />
          <span>Cargando fotos…</span>
        </div>
      </div>
    );
  }

  if (datos === null) {
    return (
      <div className="fk-pagina">
        <Estilos />
        <Barra />
        <div className="fk-centro">
          <div className="fk-vacio-ico">🔗</div>
          <h3>Enlace no válido</h3>
          <p>Este enlace no existe o ya no está disponible. Solicita uno nuevo a MAQSOL.</p>
        </div>
      </div>
    );
  }

  const titulo = [datos.equipo, datos.marca, datos.modelo].filter(Boolean).join(" ");
  const fechaStr = datos.fecha
    ? new Date(datos.fecha + "T00:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const portada = fotos[0] ? urlDe(fotos[0]) : null;

  const onTouchStart = (e) => { toqueX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (toqueX.current === null) return;
    const dx = e.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (Math.abs(dx) > 50) irA(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="fk-pagina">
      <Estilos />

      {/* ── HERO ── */}
      <header className="fk-hero">
        {portada && <div className="fk-hero-bg" style={{ backgroundImage: `url(${portada})` }} />}
        <div className="fk-hero-velo" />
        <Barra />
        <div className="fk-hero-body">
          <span className="fk-etiqueta">Expediente fotográfico</span>
          <h1>{titulo || "Equipo"}</h1>
          {datos.serie && <div className="fk-serie">Serie <strong>{datos.serie}</strong></div>}
          <div className="fk-pills">
            {datos.folio && <span className="fk-pill"><b>Folio</b> {folioVisible(datos.folio)}</span>}
            {fechaStr && <span className="fk-pill">{fechaStr}</span>}
            <span className="fk-pill fk-pill-rojo">{fotos.length} {fotos.length === 1 ? "foto" : "fotos"}</span>
          </div>
        </div>
      </header>

      {/* ── GALERÍA ── */}
      <main className="fk-contenido">
        {fotos.length === 0 ? (
          <div className="fk-centro">
            <div className="fk-vacio-ico">📷</div>
            <p>Todavía no hay fotos en este enlace.</p>
          </div>
        ) : (
          <div className="fk-grid">
            {fotos.map((f, i) => (
              <button key={f} type="button" className={`fk-foto${i === 0 && fotos.length > 2 ? " fk-grande" : ""}`} onClick={() => setIdx(i)}>
                <img src={urlDe(f)} alt={`Foto ${i + 1}`} loading={i < 4 ? "eager" : "lazy"} />
                <span className="fk-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="fk-zoom">⤢</span>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ── VISOR ── */}
      {idx !== null && (
        <div className="fk-visor" onClick={() => setIdx(null)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="fk-visor-top" onClick={(e) => e.stopPropagation()}>
            <span className="fk-cuenta">{idx + 1} <i>/ {fotos.length}</i></span>
            <div className="fk-visor-acc">
              <a className="fk-btn fk-btn-rojo" href={urlDe(fotos[idx])} target="_blank" rel="noopener noreferrer">Descargar</a>
              <button className="fk-btn" onClick={() => setIdx(null)}>Cerrar ✕</button>
            </div>
          </div>
          <div className="fk-visor-medio">
            <button className="fk-flecha" onClick={(e) => { e.stopPropagation(); irA(idx - 1); }} aria-label="Anterior">‹</button>
            <img src={urlDe(fotos[idx])} alt="" onClick={(e) => e.stopPropagation()} />
            <button className="fk-flecha" onClick={(e) => { e.stopPropagation(); irA(idx + 1); }} aria-label="Siguiente">›</button>
          </div>
          <div className="fk-tiras" onClick={(e) => e.stopPropagation()}>
            {fotos.map((f, i) => (
              <button key={f} type="button" className={i === idx ? "on" : ""} onClick={() => setIdx(i)}>
                <img src={urlDe(f)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="fk-footer">
        <img src={logo} alt="MAQSOL" />
        <span>MAQSOL · Maquinaria Soporte y Logística</span>
      </footer>
    </div>
  );
}

function Barra() {
  return (
    <div className="fk-barra">
      <img src={logo} alt="MAQSOL" />
      <div>
        <div className="fk-marca">MAQSOL</div>
        <div className="fk-lema">Maquinaria Soporte y Logística</div>
      </div>
    </div>
  );
}

function Estilos() {
  return (
    <style>{`
.fk-pagina{min-height:100vh;background:#0d0d0e;color:#f2f2f2;font-family:'Montserrat',sans-serif;display:flex;flex-direction:column}
.fk-barra{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:18px 28px;max-width:1100px;margin:0 auto;width:100%;box-sizing:border-box}
.fk-barra img{height:40px}
.fk-marca{font-weight:800;letter-spacing:3px;font-size:13px;color:#fff}
.fk-lema{font-size:11px;color:rgba(255,255,255,.6)}

.fk-hero{position:relative;overflow:hidden;border-bottom:3px solid #d6001c;background:#111}
.fk-hero-bg{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:blur(18px) saturate(1.1);transform:scale(1.1);opacity:.55}
.fk-hero-velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,14,.55) 0%,rgba(13,13,14,.78) 55%,#0d0d0e 100%),radial-gradient(60% 80% at 15% 0%,rgba(214,0,28,.28),transparent 70%)}
.fk-hero-body{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:30px 28px 46px;box-sizing:border-box}
.fk-etiqueta{display:inline-block;font-size:11px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:#ff4d5f;border:1px solid rgba(214,0,28,.55);background:rgba(214,0,28,.12);padding:5px 12px;border-radius:999px;margin-bottom:14px}
.fk-hero h1{margin:0 0 8px;font-size:clamp(26px,5vw,46px);font-weight:800;line-height:1.1;letter-spacing:-.5px;color:#fff;max-width:20ch}
.fk-serie{font-size:13px;color:rgba(255,255,255,.7);margin-bottom:18px}
.fk-serie strong{color:#fff;letter-spacing:.5px}
.fk-pills{display:flex;flex-wrap:wrap;gap:8px}
.fk-pill{font-size:12px;font-weight:600;color:#e9e9e9;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);padding:6px 14px;border-radius:999px;backdrop-filter:blur(6px)}
.fk-pill b{color:#ff4d5f;margin-right:4px;font-weight:700}
.fk-pill-rojo{background:#d6001c;border-color:#d6001c;color:#fff}

.fk-contenido{flex:1;max-width:1100px;margin:0 auto;width:100%;box-sizing:border-box;padding:30px 20px 50px}
.fk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));grid-auto-flow:dense;gap:14px}
.fk-foto{position:relative;border:0;padding:0;margin:0;cursor:zoom-in;overflow:hidden;border-radius:16px;background:#1b1b1d;aspect-ratio:4/3;box-shadow:0 6px 20px rgba(0,0,0,.45);outline:1px solid rgba(255,255,255,.06);transition:transform .25s,box-shadow .25s,outline-color .25s}
.fk-foto img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.fk-foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.55));opacity:.8;transition:opacity .25s}
.fk-foto:hover{transform:translateY(-3px);outline-color:#d6001c;box-shadow:0 14px 34px rgba(214,0,28,.25)}
.fk-foto:hover img{transform:scale(1.07)}
.fk-num{position:absolute;left:12px;bottom:10px;z-index:2;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#fff}
.fk-zoom{position:absolute;right:12px;top:10px;z-index:2;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:15px;display:grid;place-items:center;opacity:0;transform:scale(.85);transition:opacity .2s,transform .2s}
.fk-foto:hover .fk-zoom{opacity:1;transform:none}
@media (min-width:640px){.fk-grande{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}}

.fk-centro{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:70px 24px;text-align:center;color:#aaa;font-size:14px}
.fk-centro h3{margin:0;color:#fff}
.fk-centro p{margin:0;max-width:420px}
.fk-vacio-ico{font-size:40px}
.fk-spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.12);border-top-color:#d6001c;border-radius:50%;animation:spin .8s linear infinite}

.fk-visor{position:fixed;inset:0;z-index:100;background:rgba(6,6,7,.97);display:flex;flex-direction:column;padding:14px 12px 12px;box-sizing:border-box}
.fk-visor-top{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:1200px;margin:0 auto;width:100%;padding:0 6px}
.fk-cuenta{font-size:20px;font-weight:800;color:#fff}
.fk-cuenta i{font-style:normal;font-size:13px;font-weight:600;color:#888}
.fk-visor-acc{display:flex;gap:8px}
.fk-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#ddd;border-radius:999px;padding:9px 18px;font:700 12px 'Montserrat',sans-serif;text-decoration:none;cursor:pointer;transition:background .2s}
.fk-btn:hover{background:rgba(255,255,255,.18)}
.fk-btn-rojo{background:#d6001c;border-color:#d6001c;color:#fff}
.fk-btn-rojo:hover{background:#ef1a35}
.fk-visor-medio{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:4px;max-width:1200px;margin:0 auto;width:100%}
.fk-visor-medio img{flex:1;min-width:0;max-height:100%;max-width:100%;object-fit:contain;border-radius:10px;box-shadow:0 10px 50px rgba(0,0,0,.6)}
.fk-flecha{flex:none;border:0;background:rgba(255,255,255,.08);color:#fff;width:44px;height:44px;border-radius:50%;font-size:30px;line-height:1;cursor:pointer;transition:background .2s;display:grid;place-items:center;padding:0 0 4px}
.fk-flecha:hover{background:#d6001c}
.fk-tiras{display:flex;gap:8px;overflow-x:auto;padding:12px 6px 2px;max-width:1200px;margin:0 auto;width:100%;box-sizing:border-box;scrollbar-width:thin}
.fk-tiras button{flex:none;width:64px;height:48px;padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;background:#222;opacity:.55;transition:opacity .2s,border-color .2s}
.fk-tiras button.on{opacity:1;border-color:#d6001c}
.fk-tiras button:hover{opacity:1}
.fk-tiras img{width:100%;height:100%;object-fit:cover;display:block}
@media (max-width:560px){.fk-flecha{display:none}.fk-barra{padding:14px 18px}.fk-hero-body{padding:22px 18px 34px}.fk-contenido{padding:22px 12px 40px}.fk-grid{grid-template-columns:repeat(2,1fr);gap:10px}.fk-foto{border-radius:12px}}

.fk-footer{display:flex;align-items:center;justify-content:center;gap:10px;padding:20px;border-top:1px solid rgba(255,255,255,.08);background:#090909;font-size:12px;color:#777}
.fk-footer img{height:26px;opacity:.8}
    `}</style>
  );
}

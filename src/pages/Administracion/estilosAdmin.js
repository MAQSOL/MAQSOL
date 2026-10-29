export const S = {
  h1: { fontSize: 30, fontWeight: 800, margin: 0 },
  h2: { fontSize: 18, fontWeight: 800, margin: 0 },
  sub: { color: "#777", margin: "4px 0 0", fontSize: 14 },
  card: { background: "#fff", border: "3px solid #111", borderRadius: 0, padding: 24, marginBottom: 28, boxShadow: "6px 6px 0 #111" },
  btn: { padding: "10px 18px", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
  btnGris: { padding: "10px 18px", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnVerde: { padding: "10px 18px", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  input: { width: "100%", padding: "11px 12px", border: "2px solid #222", borderRadius: 0, fontSize: 14, boxSizing: "border-box", background: "#fff" },
  label: { fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 5, display: "block", letterSpacing: "0.5px" },
  th: { textAlign: "left", padding: "12px 10px", fontSize: 12, letterSpacing: 0.5, color: "#fff", background: "#111", fontWeight: 700, whiteSpace: "nowrap", borderRight: "1px solid #2a2a2a" },
  td: { padding: "11px 10px", borderBottom: "2px solid #f0f0f0", fontSize: 14 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 30, overflowY: "auto", zIndex: 999 },
  modal: { background: "#fff", border: "3px solid #111", borderRadius: 0, boxShadow: "8px 8px 0 #111", padding: 26, width: "100%", maxWidth: 760 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 },
  h3: { fontSize: 15, fontWeight: 800, margin: "8px 0 10px", color: "var(--acento)", textTransform: "uppercase", letterSpacing: "1px" }
};

export const fFecha = (f) => (f ? new Date(f + "T00:00:00").toLocaleDateString("es-MX") : "—");
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const dinero = (n) =>
  n === "" || n === null || n === undefined || isNaN(Number(n))
    ? "—"
    : Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

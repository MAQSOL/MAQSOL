export const S = {
  h1: { fontSize: 30, fontWeight: 800, margin: 0 },
  sub: { color: "#777", margin: "4px 0 0", fontSize: 14 },
  card: { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,.05)" },
  btn: { background: "var(--acento)", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnGris: { background: "#e9e9e9", color: "#333", border: "none", borderRadius: 6, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnVerde: { background: "#1f8b4c", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  input: { width: "100%", padding: "11px 12px", border: "1px solid #d8d8d8", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "#fff" },
  label: { fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 5, display: "block" },
  th: { textAlign: "left", padding: "12px 10px", fontSize: 12, letterSpacing: 0.5, color: "#fff", background: "#222", fontWeight: 700, whiteSpace: "nowrap" },
  td: { padding: "11px 10px", borderBottom: "1px solid #eee", fontSize: 14 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 30, overflowY: "auto", zIndex: 999 },
  modal: { background: "#fff", borderRadius: 10, padding: 26, width: "100%", maxWidth: 760 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 },
  h3: { fontSize: 15, fontWeight: 800, margin: "8px 0 10px", color: "var(--acento)" }
};

export const fFecha = (f) => (f ? new Date(f + "T00:00:00").toLocaleDateString("es-MX") : "—");
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const dinero = (n) =>
  n === "" || n === null || n === undefined || isNaN(Number(n))
    ? "—"
    : Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

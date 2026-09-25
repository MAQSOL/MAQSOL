import jsPDF from "jspdf";

/** Dirección pública que lleva el QR (nunca localhost, para que funcione al escanear). */
export function urlBase() {
  const fija = import.meta.env.VITE_URL_PUBLICA;
  if (fija) return fija.replace(/\/$/, "");
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1" || /^192\.168\./.test(hostname) || /^10\./.test(hostname)) {
    return "https://maqsol.vercel.app";
  }
  return origin;
}

export const urlEquipo = (token) => `${urlBase()}/e/${token}`;

export function nuevoToken() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function qrDataUrl(url, ancho = 600) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(url, { margin: 1, width: ancho, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
}

export function descargarPNG(dataUrl, nombre) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombre + ".png";
  a.click();
}

/** Etiqueta imprimible (10 x 14 cm) para pegar en la máquina. */
export function descargarEtiquetaQR(equipo, dataUrl, url, logoUrl) {
  const doc = new jsPDF({ unit: "mm", format: [100, 140] });
  const W = 100;

  doc.setFillColor(29, 92, 143);
  doc.rect(0, 0, W, 22, "F");
  if (logoUrl) {
    try { doc.addImage(logoUrl, "PNG", 5, 3, 15, 16); } catch { /* sin logo */ }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("MAQSOL", 24, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Maquinaria Soporte y Logística", 24, 15.5);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(equipo.tipo || "Equipo", W - 12), W / 2, 31, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`${equipo.marca || ""} ${equipo.modelo || ""}`.trim(), W / 2, 37, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Serie: ${equipo.serie || "s/n"}`, W / 2, 42, { align: "center" });

  doc.addImage(dataUrl, "PNG", 15, 47, 70, 70);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Escanea para ver la información", W / 2, 123, { align: "center" });
  doc.text("y el historial de este equipo", W / 2, 128, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(url, W / 2, 135, { align: "center", maxWidth: W - 8 });

  doc.save(`QR-${(equipo.serie || equipo.tipo || "equipo").toString().replace(/\s+/g, "-")}.pdf`);
}

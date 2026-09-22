const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUN", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
const DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function menorDeMil(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const r = n % 100;
  let texto = CENTENAS[c];
  if (r > 0) {
    if (r < 30) texto += (texto ? " " : "") + UNIDADES[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      texto += (texto ? " " : "") + DECENAS[d] + (u ? " Y " + UNIDADES[u] : "");
    }
  }
  return texto;
}

export function enteroALetras(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return "CERO";
  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? "UN MILLON" : menorDeMil(millones) + " MILLONES");
  if (miles) partes.push(miles === 1 ? "MIL" : menorDeMil(miles) + " MIL");
  if (resto) partes.push(menorDeMil(resto));
  return partes.join(" ");
}

export function montoALetras(monto, moneda = "U.S.C.Y.") {
  const n = Number(monto) || 0;
  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  return `${enteroALetras(entero)}, ${String(centavos).padStart(2, "0")}/100 ${moneda}`;
}

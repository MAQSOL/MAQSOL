// Expediente del cliente: contrato firmado y documentación según persona física o moral.
// Las listas de requisitos son un punto de partida; se ajustan aquí en un solo lugar.

export const REQUISITOS = {
  fisica: [
    { k: "ine", n: "Identificación oficial (INE)" },
    { k: "domicilio", n: "Comprobante de domicilio" },
    { k: "rfc", n: "Constancia de situación fiscal (RFC)" },
    { k: "curp", n: "CURP" },
    { k: "pagare", n: "Pagaré firmado" },
    { k: "depositario", n: "Carta de depositario firmada" }
  ],
  moral: [
    { k: "acta", n: "Acta constitutiva" },
    { k: "poder", n: "Poder del representante legal" },
    { k: "ine", n: "INE del representante legal" },
    { k: "rfc", n: "Constancia de situación fiscal (RFC)" },
    { k: "domicilio", n: "Comprobante de domicilio fiscal" },
    { k: "pagare", n: "Pagaré firmado" },
    { k: "aval", n: "Identificación y datos del aval" },
    { k: "depositario", n: "Carta de depositario firmada" }
  ]
};

export const NOMBRE_TIPO = { fisica: "Persona física", moral: "Persona moral" };

export const normalizaNombre = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export function buscarCliente(clientes, nombre) {
  const n = normalizaNombre(nombre);
  if (!n) return null;
  return clientes.find((c) => normalizaNombre(c.cliente) === n) || null;
}

/** Resumen del expediente de un cliente (o null si el cliente no está dado de alta). */
export function estadoExpediente(cliente) {
  if (!cliente) return null;
  const tipo = cliente.tipoPersona === "fisica" || cliente.tipoPersona === "moral" ? cliente.tipoPersona : "";
  const lista = tipo ? REQUISITOS[tipo] : [];
  const entregados = cliente.docsEntregados || {};
  const faltan = lista.filter((d) => !entregados[d.k]);
  return {
    tipo,
    contrato: !!cliente.contratoFirmado,
    contratoFecha: cliente.contratoFecha || "",
    total: lista.length,
    entregados: lista.length - faltan.length,
    faltan,
    completo: !!tipo && faltan.length === 0 && !!cliente.contratoFirmado
  };
}

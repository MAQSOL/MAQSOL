import { useState } from "react";

// Ordenar una tabla al hacer clic en sus encabezados.
//   const { ordenar, thOrden } = useOrdenTabla({ fecha: "desc" });
//   const filas = ordenar(lista, (f, col) => valor, ordenPorDefecto);
//   <thead>{thOrden("cliente", "CLIENTE", S.th)}</thead>
// primerSentido: columnas que conviene empezar de mayor a menor (ej. fechas).
export function useOrdenTabla(primerSentido = {}) {
  const [orden, setOrden] = useState({ col: null, dir: 1 });

  const ordenarPor = (col) =>
    setOrden((o) => (o.col === col ? { col, dir: -o.dir } : { col, dir: primerSentido[col] === "desc" ? -1 : 1 }));

  const ordenar = (lista, valorDe, porDefecto) => {
    if (!orden.col) return porDefecto ? [...lista].sort(porDefecto) : lista;
    return [...lista].sort((a, b) => {
      const x = valorDe(a, orden.col) ?? "";
      const y = valorDe(b, orden.col) ?? "";
      const c = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "es", { numeric: true, sensitivity: "base" });
      return c * orden.dir || (porDefecto ? porDefecto(a, b) : 0);
    });
  };

  const thOrden = (col, texto, estilo = {}) => {
    const on = orden.col === col;
    return (
      <th key={col} style={{ ...estilo, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => ordenarPor(col)} title="Ordenar por esta columna">
        {texto}
        <span style={{ marginLeft: 6, fontSize: 10, opacity: on ? 1 : 0.35 }}>{on ? (orden.dir === 1 ? "▲" : "▼") : "▲▼"}</span>
      </th>
    );
  };

  return { orden, ordenar, thOrden };
}

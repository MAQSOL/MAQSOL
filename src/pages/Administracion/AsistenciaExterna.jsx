import { useEffect, useRef, useState } from "react";
import DeleteButton from "../../components/DeleteButton";
import { supabase } from "../../supabaseClient";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { descargarExcelBonito } from "../../utils/exportExcel";
import { abrirDocPDF, encabezadoDoc, hoyMX, AZUL } from "../../utils/pdfFormato";

const VINO = "var(--acento)";
const VERDE = "#2e7d32";
const ROJO = "#b00020";

const LETRA_DIA = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 24 quincenas al año: la 1 es del 1 al 15 de enero, la 2 del 16 al 31 de enero, y así.
const quincenaDe = (f) => ({ num: f.getMonth() * 2 + (f.getDate() <= 15 ? 1 : 2), anio: f.getFullYear() });

function rangoQuincena(num, anio) {
  const mes = Math.floor((num - 1) / 2);
  const primera = num % 2 === 1;
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  const ini = primera ? 1 : 16;
  const fin = primera ? 15 : ultimo;
  const dias = [];
  for (let d = ini; d <= fin; d++) dias.push(new Date(anio, mes, d));
  return { mes, ini, fin, dias };
}

const estiloInput = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  textAlign: "center"
};

const estiloFlecha = {
  background: VINO,
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "42px",
  height: "42px",
  cursor: "pointer",
  fontSize: "17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const botonEstado = (estado, domingo) => ({
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "50%",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
  color: estado === "" ? "#bbb" : "#fff",
  background: estado === "A" ? VERDE : estado === "F" ? ROJO : domingo ? "#e4e4e4" : "#f0f0f0",
  boxShadow: estado !== "" ? "0 2px 5px rgba(0,0,0,.18)" : "none"
});

const chip = (color, fondo) => ({
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  color,
  background: fondo,
  margin: "2px"
});

export default function AsistenciaExterna() {
  const [personas, guardarPersonas] = useListaCompartida("personal_externo");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPuesto, setNuevoPuesto] = useState("");

  const [quincena, setQuincena] = useState(() => quincenaDe(new Date()));
  const [irNum, setIrNum] = useState("");
  const [irAnio, setIrAnio] = useState(new Date().getFullYear());
  const { num, anio } = quincena;
  const { mes, ini, fin, dias } = rangoQuincena(num, anio);
  const clave = `${anio}-Q${num}`;
  const hoy = new Date();

  const [datos, setDatos] = useState({});
  const datosRef = useRef({});
  const [obsDe, setObsDe] = useState(null);
  const [obsTexto, setObsTexto] = useState("");

  useEffect(() => {
    let vivo = true;
    supabase
      .from("asistencias")
      .select("data")
      .eq("id", clave)
      .maybeSingle()
      .then(({ data }) => {
        if (!vivo) return;
        datosRef.current = data?.data || {};
        setDatos(datosRef.current);
      });
    return () => {
      vivo = false;
    };
  }, [clave]);

  function actualizar(cambio) {
    const copia = JSON.parse(JSON.stringify(datosRef.current));
    cambio(copia);
    datosRef.current = copia;
    setDatos(copia);
    supabase
      .from("asistencias")
      .upsert({ id: clave, data: copia, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) alert("No se pudo guardar la asistencia: " + error.message);
      });
  }

  const estadoDe = (id, d) => datos?.[id]?.[d] || "";
  const obsDePersona = (id) => datos?.[id]?.obs || "";

  function ciclar(id, d) {
    actualizar((c) => {
      if (!c[id]) c[id] = {};
      const actual = c[id][d] || "";
      const nuevo = actual === "" ? "A" : actual === "A" ? "F" : "";
      if (nuevo) c[id][d] = nuevo;
      else delete c[id][d];
    });
  }

  function guardarObs(id, texto) {
    actualizar((c) => {
      if (!c[id]) c[id] = {};
      if (texto.trim()) c[id].obs = texto.trim();
      else delete c[id].obs;
    });
  }

  function resumen(id) {
    let asistencias = 0;
    let faltas = 0;
    dias.forEach((f) => {
      const e = estadoDe(id, f.getDate());
      if (e === "A") asistencias++;
      if (e === "F" && f.getDay() !== 0) faltas++;
    });
    return { asistencias, faltas };
  }

  function agregar() {
    if (!nuevoNombre.trim()) return alert("Escribe el nombre del practicante.");
    guardarPersonas([...personas, { id: String(Date.now()), nombre: nuevoNombre.trim(), puesto: nuevoPuesto.trim(), baja: false }]);
    setNuevoNombre("");
    setNuevoPuesto("");
  }
  const alternarBaja = (id) => guardarPersonas(personas.map((p) => (p.id === id ? { ...p, baja: !p.baja } : p)));
  const eliminarPersona = (id) => guardarPersonas(personas.filter((p) => p.id !== id));

  function cambiarQuincena(delta) {
    setQuincena(({ num: n, anio: a }) => {
      let nn = n + delta;
      let aa = a;
      if (nn < 1) {
        nn = 24;
        aa -= 1;
      } else if (nn > 24) {
        nn = 1;
        aa += 1;
      }
      return { num: nn, anio: aa };
    });
  }
  function irAQuincena() {
    const n = parseInt(irNum, 10);
    if (!n || n < 1 || n > 24) return alert("Escribe un número de quincena válido (1 a 24).");
    setQuincena({ num: n, anio: parseInt(irAnio, 10) || new Date().getFullYear() });
  }

  const rangoTexto = `Del ${ini} al ${fin} de ${MESES[mes]}`;
  const nombreArchivo = `A-EXTERNO-Q${String(num).padStart(2, "0")}-${anio}`;

  function descargarExcel() {
    const columnas = ["Practicante", "Puesto / escuela", ...dias.map((f) => `${LETRA_DIA[f.getDay()]} ${f.getDate()}`), "Asistencias", "Faltas", "Observaciones"];
    const filas = personas.map((p) => {
      const r = resumen(p.id);
      return [
        p.nombre + (p.baja ? " (baja)" : ""),
        p.puesto || "",
        ...dias.map((f) => {
          const e = estadoDe(p.id, f.getDate());
          return e === "A" ? "A" : e === "F" ? "F" : f.getDay() === 0 ? "D" : "";
        }),
        r.asistencias,
        r.faltas,
        obsDePersona(p.id)
      ];
    });
    descargarExcelBonito({
      titulo: "Asistencia · Personal externo",
      subtitulo: `Quincena ${num} · ${anio} · ${rangoTexto}`,
      columnas,
      filas,
      nombreArchivo
    });
  }

  function descargarPDF() {
    const cabDias = dias
      .map((f) => `<th class="d${f.getDay() === 0 ? " dom" : ""}">${LETRA_DIA[f.getDay()]}<br>${f.getDate()}</th>`)
      .join("");
    const filas = personas
      .map((p) => {
        const r = resumen(p.id);
        const celdas = dias
          .map((f) => {
            const e = estadoDe(p.id, f.getDate());
            const dom = f.getDay() === 0;
            const clase = e === "A" ? "a" : e === "F" ? "f" : dom ? "dom" : "";
            const txt = e === "A" ? "A" : e === "F" ? "F" : dom ? "D" : "";
            return `<td class="c ${clase}">${txt}</td>`;
          })
          .join("");
        return `<tr><td class="n">${esc(p.nombre)}${p.puesto ? `<small>${esc(p.puesto)}</small>` : ""}</td>${celdas}<td class="t">${r.asistencias}</td><td class="t">${r.faltas}</td><td class="o">${esc(obsDePersona(p.id))}</td></tr>`;
      })
      .join("");
    // matriz persona x día: sin renglones alternos, cada celda lleva el color de su estado
    abrirDocPDF({
      nombre: nombreArchivo,
      hoja: "horizontal",
      css: `
        table.q{font-size:10px;}
        table.q th,table.q tbody tr td{border:1px solid #dde5ee;padding:4px 3px;text-align:center;background:#fff;}
        table.q thead th{background:${AZUL};color:#fff;border-color:${AZUL};font-size:9px;}
        table.q thead th.dom{background:#4a7fab;}
        table.q tbody tr td.n{text-align:left;font-weight:700;padding-left:6px;min-width:120px;}
        table.q td.n small{display:block;font-weight:400;color:#777;font-size:8px;}
        table.q tbody tr td.c{font-weight:800;width:22px;}
        table.q tbody tr td.a{background:#a9d18e;color:#1a7f37;}
        table.q tbody tr td.f{background:#f4b6b6;color:#c62828;}
        table.q tbody tr td.dom{background:#bcd4e6;color:#1a4d7a;font-weight:700;}
        table.q tbody tr td.t{font-weight:800;width:34px;}
        table.q tbody tr td.o{text-align:left;font-size:8.5px;min-width:90px;}`,
      cuerpo: `${encabezadoDoc("Lista de Asistencia · Personal externo", [`Quincena ${num} · ${anio} · ${rangoTexto}`, "Generado: " + hoyMX()])}
        <table class="q">
          <thead><tr><th style="text-align:left;padding-left:6px">PRACTICANTE</th>${cabDias}<th>ASIST.</th><th>FALTAS</th><th>OBSERVACIONES</th></tr></thead>
          <tbody>${filas || '<tr><td colspan="99">Sin personal registrado.</td></tr>'}</tbody>
        </table>`
    });
  }

  return (
    <>
      <div className="panel">
        <h3 style={{ textAlign: "center", marginBottom: "6px" }}>Agregar personal externo</h3>
        <p style={{ textAlign: "center", color: "#999", fontSize: "13px", margin: "0 0 18px" }}>
          Practicantes y personal que no es de planta. Su asistencia se lleva por quincena.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", maxWidth: "760px", margin: "0 auto" }}>
          <input placeholder="Nombre completo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={{ ...estiloInput, flex: "1 1 260px" }} />
          <input placeholder="Puesto o escuela (ej. Practicante · UT Cancún)" value={nuevoPuesto} onChange={(e) => setNuevoPuesto(e.target.value)} style={{ ...estiloInput, flex: "1 1 260px" }} />
          <button
            onClick={agregar}
            style={{ background: VERDE, color: "#fff", border: "none", borderRadius: "10px", padding: "13px 30px", cursor: "pointer", fontWeight: "700", fontSize: "15px", whiteSpace: "nowrap" }}
          >
            + Agregar
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginBottom: "18px" }}>
          <button style={estiloFlecha} onClick={() => cambiarQuincena(-1)}>←</button>
          <div style={{ textAlign: "center", minWidth: "230px" }}>
            <h3 style={{ margin: 0, color: VINO }}>Quincena {num} · {anio}</h3>
            <small style={{ color: "#888" }}>{rangoTexto}</small>
          </div>
          <button style={estiloFlecha} onClick={() => cambiarQuincena(1)}>→</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          <small style={{ color: "#999" }}>Ir directo a la quincena:</small>
          <input type="number" min="1" max="24" placeholder="1-24" value={irNum} onChange={(e) => setIrNum(e.target.value)} style={{ ...estiloInput, width: "78px", padding: "8px 10px" }} />
          <input type="number" placeholder="Año" value={irAnio} onChange={(e) => setIrAnio(e.target.value)} style={{ ...estiloInput, width: "85px", padding: "8px 10px" }} />
          <button onClick={irAQuincena} style={{ background: VINO, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
            Ir
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={() => setQuincena(quincenaDe(new Date()))} style={{ background: "#f0f0f0", color: "#666", border: "none", borderRadius: "10px", padding: "11px 22px", cursor: "pointer", fontWeight: "600" }}>
            Quincena actual
          </button>
          <button onClick={descargarExcel} style={{ background: VERDE, color: "#fff", border: "none", borderRadius: "10px", padding: "11px 22px", cursor: "pointer", fontWeight: "700" }}>
            Excel
          </button>
          <button onClick={descargarPDF} style={{ background: VINO, color: "#fff", border: "none", borderRadius: "10px", padding: "11px 22px", cursor: "pointer", fontWeight: "700" }}>
            PDF
          </button>
        </div>
        <p style={{ textAlign: "center", color: "#999", fontSize: "13px", margin: 0 }}>
          Un clic marca asistencia, dos marcan falta, tres limpian la celda · Domingo es descanso (D)
        </p>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {personas.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", padding: "40px 20px", margin: 0 }}>
            Aún no hay personal externo. Agrega al primer practicante arriba.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${300 + dias.length * 46}px` }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 8px", background: VINO, color: "#fff", fontSize: "13px", textAlign: "left", paddingLeft: "20px" }}>PRACTICANTE</th>
                  {dias.map((f) => {
                    const esDom = f.getDay() === 0;
                    return (
                      <th key={f.getDate()} style={{ padding: "8px 2px", background: esDom ? "#555" : VINO, color: "#fff", fontSize: "11px", textAlign: "center", minWidth: "40px" }}>
                        {LETRA_DIA[f.getDay()]}
                        <br />
                        {f.getDate()}
                      </th>
                    );
                  })}
                  <th style={{ padding: "12px 8px", background: "#2b2b2b", color: "#fff", fontSize: "13px" }}>RESUMEN</th>
                  <th style={{ background: "#2b2b2b", width: "50px" }}></th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p, fila) => {
                  const r = resumen(p.id);
                  const tieneObs = !!obsDePersona(p.id);
                  return (
                    <tr key={p.id} style={{ background: fila % 2 === 0 ? "#fff" : "#fbfbfb", opacity: p.baja ? 0.55 : 1 }}>
                      <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px 10px 20px", textAlign: "left" }}>
                        <strong style={{ fontSize: "14px", textDecoration: p.baja ? "line-through" : "none" }}>{p.nombre}</strong>
                        {p.baja && <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: "700", color: ROJO, background: "#fdeaec", padding: "2px 7px", borderRadius: "10px" }}>DE BAJA</span>}
                        <br />
                        <small style={{ color: "#999" }}>{p.puesto}</small>
                        <br />
                        <button onClick={() => alternarBaja(p.id)} style={{ marginTop: "3px", background: "transparent", border: "none", color: p.baja ? VERDE : "#999", fontSize: "11px", fontWeight: "600", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                          {p.baja ? "Reactivar" : "Dar de baja"}
                        </button>
                        <br />
                        <button
                          onClick={() => {
                            setObsTexto(obsDePersona(p.id));
                            setObsDe(p);
                          }}
                          style={{
                            marginTop: "5px",
                            background: tieneObs ? "#fff6d8" : "#f1f1f1",
                            border: "1px solid " + (tieneObs ? "#e6c85a" : "#e0e0e0"),
                            color: tieneObs ? "#8a6d00" : "#555",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            borderRadius: "8px",
                            padding: "4px 10px"
                          }}
                        >
                          📝 Observaciones{tieneObs ? " ●" : ""}
                        </button>
                      </td>
                      {dias.map((f) => {
                        const d = f.getDate();
                        const e = estadoDe(p.id, d);
                        const dom = f.getDay() === 0;
                        const esHoy = f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth() && d === hoy.getDate();
                        return (
                          <td key={d} style={{ borderBottom: "1px solid #eee", padding: "8px 2px", textAlign: "center", background: dom ? "#f7f7f7" : esHoy ? "#fff8f9" : "transparent" }}>
                            <button style={botonEstado(e, dom)} onClick={() => ciclar(p.id, d)} title={dom ? "Domingo de descanso · marcar solo si trabajó" : "Clic para cambiar"}>
                              {e === "A" ? "✓" : e === "F" ? "✕" : dom ? "D" : "—"}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ borderBottom: "1px solid #eee", padding: "8px", textAlign: "center" }}>
                        <div><span style={chip(VERDE, "#e8f5e9")}>{r.asistencias} asist.</span></div>
                        <div><span style={chip(ROJO, "#fdeaec")}>{r.faltas} faltas</span></div>
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                        <DeleteButton size="sm" title="Eliminar practicante" onConfirm={() => eliminarPersona(p.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {obsDe && (
        <div
          onClick={() => setObsDe(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "18px", padding: "30px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <h3 style={{ marginBottom: "2px" }}>Observaciones · {obsDe.nombre}</h3>
            <p style={{ color: "#999", marginBottom: "16px", fontSize: "14px" }}>Quincena {num} · {anio} · {rangoTexto}</p>
            <textarea
              autoFocus
              value={obsTexto}
              onChange={(e) => setObsTexto(e.target.value)}
              placeholder="Permisos, retardos, horario de la escuela, notas de la quincena…"
              style={{ ...estiloInput, minHeight: "120px", resize: "vertical", textAlign: "left" }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button onClick={() => setObsDe(null)} style={{ flex: 1, background: "#eee", color: "#333", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", fontWeight: "700" }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  guardarObs(obsDe.id, obsTexto);
                  setObsDe(null);
                }}
                style={{ flex: 1, background: VINO, color: "#fff", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", fontWeight: "700" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";

const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Número que "cuenta" hasta su valor (0 → 3) en ~0.9 s. Si el valor cambia
 * (p. ej. cuando llegan los datos de Supabase) cuenta desde el anterior.
 * Con "reducir movimiento" activado en el sistema, muestra el valor directo.
 */
export default function Contador({ valor, duracion = 900 }) {
  const destino = Number(valor) || 0;
  const [mostrado, setMostrado] = useState(0);
  const desde = useRef(0);   // desde dónde arranca la próxima cuenta (lo último que se vio)

  useEffect(() => {
    if (reducirMovimiento()) return;
    const inicio = desde.current;
    const t0 = performance.now();
    let raf;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / duracion);
      const suave = 1 - Math.pow(1 - p, 3);   // arranca rápido y frena al llegar
      const v = Math.round(inicio + (destino - inicio) * suave);
      desde.current = v;
      setMostrado(v);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [destino, duracion]);

  return reducirMovimiento() ? destino : mostrado;
}

import { useState } from "react";

/**
 * Campo de texto que guarda al SALIR del campo (o con Enter), no en cada tecla.
 * Guardar por tecla contra Supabase se comía letras: mientras llegaba la respuesta
 * de un guardado, el campo se repintaba con el valor viejo.
 * Si el valor guardado cambia desde fuera, el campo se reinicia con el nuevo (key).
 */
export default function CampoDiferido(props) {
  return <CampoInterno key={String(props.valor ?? "")} {...props} />;
}

function CampoInterno({ valor = "", onGuardar, multilinea = false, ...resto }) {
  const [texto, setTexto] = useState(valor ?? "");
  const guardar = () => {
    if (texto !== (valor ?? "")) onGuardar(texto);
  };
  const comunes = { ...resto, value: texto, onChange: (e) => setTexto(e.target.value), onBlur: guardar };
  return multilinea ? (
    <textarea {...comunes} />
  ) : (
    <input {...comunes} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
  );
}

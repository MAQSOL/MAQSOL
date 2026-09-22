import { useRef, useState } from "react";
import "./OtpInput.css";

/**
 * Casillas de código (NIP/OTP), adaptado a React + CSS puro (sin Next.js
 * ni la librería "motion" que no existen en este proyecto). Cada dígito
 * en su propia casilla, avanza solo, acepta pegar el código completo y
 * "tiembla" en rojo si status="error".
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  status = "idle", // idle | success | error
  disabled,
  autoFocus
}) {
  const [interno, setInterno] = useState(() => Array(length).fill(""));
  const inputs = useRef([]);

  const slots = value !== undefined ? value.split("").slice(0, length) : interno;
  while (slots.length < length) slots.push("");

  function commit(next) {
    if (value === undefined) setInterno(next);
    const codigo = next.join("");
    onChange && onChange(codigo);
    if (next.every(Boolean)) onComplete && onComplete(codigo);
  }

  function enfocar(i) {
    const el = inputs.current[Math.max(0, Math.min(length - 1, i))];
    el && el.focus();
    el && el.select();
  }

  function onDigit(i, raw) {
    const chars = raw.replace(/[^0-9]/g, "");
    if (!chars) return;
    if (chars.length > 1) {
      // pegado o autocompletado completo
      const next = [...slots];
      chars.split("").forEach((c, j) => {
        if (i + j < length) next[i + j] = c;
      });
      commit(next);
      enfocar(i + chars.length);
      return;
    }
    const next = [...slots];
    next[i] = chars;
    commit(next);
    enfocar(i + 1);
  }

  function onKeyDown(i, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...slots];
      if (next[i]) {
        next[i] = "";
        commit(next);
      } else if (i > 0) {
        next[i - 1] = "";
        commit(next);
        enfocar(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      enfocar(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      enfocar(i + 1);
    }
  }

  function onPaste(i, e) {
    e.preventDefault();
    const texto = (e.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
    if (!texto) return;
    const next = [...slots];
    texto.split("").forEach((c, j) => {
      if (i + j < length) next[i + j] = c;
    });
    commit(next);
    enfocar(i + texto.length);
  }

  return (
    <div className={`otpinput otpinput-${status}`}>
      {slots.map((s, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          className="otpinput-slot"
          type="password"
          inputMode="numeric"
          maxLength={2}
          value={s}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => onDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Dígito ${i + 1} de ${length}`}
        />
      ))}
    </div>
  );
}

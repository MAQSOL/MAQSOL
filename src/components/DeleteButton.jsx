import { useEffect, useRef, useState } from "react";
import "./DeleteButton.css";

/**
 * Botón de eliminar con confirmación inline animada (bote de basura que
 * abre la tapa y muestra ✓ / ✕ en vez de un window.confirm()).
 *
 * Props:
 *  - onConfirm: función a ejecutar cuando se confirma el borrado
 *  - onCancel: opcional, función al cancelar
 *  - size: "sm" | "md" (default "md")
 *  - title: texto accesible del botón (default "Eliminar")
 */
export default function DeleteButton({
  onConfirm,
  onCancel,
  size = "md",
  title = "Eliminar"
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | deleted
  const wrapRef = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (status !== "deleted") return;
    const t = setTimeout(() => setStatus("idle"), 900);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function confirmar(e) {
    e.stopPropagation();
    setOpen(false);
    setStatus("deleted");
    onConfirm && onConfirm();
    trigger.current && trigger.current.focus();
  }

  function cancelar(e) {
    e.stopPropagation();
    setOpen(false);
    onCancel && onCancel();
    trigger.current && trigger.current.focus();
  }

  return (
    <div
      ref={wrapRef}
      className={`delbtn delbtn-${size} ${open ? "delbtn-open" : ""}`}
      data-status={status}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={title}
        aria-expanded={open}
        title={title}
        className="delbtn-trigger"
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOpen(false);
            return;
          }
          setStatus("idle");
          setOpen(true);
        }}
      >
        {status === "deleted" ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <path
              d="M4 12.5 9.5 18 20 7"
              stroke="#1f8b4c"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="delbtn-check"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <g className="delbtn-lid">
              <path
                d="M3 6h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <path
              d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="delbtn-panel">
        <button
          type="button"
          aria-label="Confirmar borrado"
          className="delbtn-circle delbtn-circle-ok"
          onClick={confirmar}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
            <path
              d="M4 12.5 9.5 18 20 7"
              stroke="#1f8b4c"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Cancelar"
          className="delbtn-circle delbtn-circle-no"
          onClick={cancelar}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
            <path
              d="M6 6 18 18M18 6 6 18"
              stroke="#c62828"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

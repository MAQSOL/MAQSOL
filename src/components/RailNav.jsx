import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const CORNER = 6;

/**
 * Lista de menú con un "riel" animado (línea + codo curvo) que se desliza
 * hacia el ítem activo/en hover, sin dependencias externas (CSS puro).
 */
export default function RailNav({ items, color = "var(--acento)", dashed = true, onNavigate }) {
  const location = useLocation();
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [hoverIndex, setHoverIndex] = useState(null);

  const activeIndex = items.findIndex((it) => it.href === location.pathname);

  function medir(i) {
    const el = itemRefs.current[i];
    if (!el) return null;
    return el.offsetTop + el.offsetHeight / 2;
  }

  const showIndex = hoverIndex !== null ? hoverIndex : activeIndex;
  const y = showIndex !== null && showIndex !== -1 ? medir(showIndex) : null;
  const visible = y !== null;
  const esActivo = hoverIndex === null && activeIndex !== -1;

  return (
    <div
      ref={listRef}
      style={{ position: "relative" }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 2,
          top: 0,
          width: 1,
          height: visible ? Math.max(0, y - CORNER) : 0,
          backgroundImage: dashed
            ? `repeating-linear-gradient(to bottom, transparent 0 2px, ${
                esActivo ? color : `color-mix(in srgb, ${color} 55%, transparent)`
              } 2px 4px)`
            : "none",
          backgroundColor: dashed ? "transparent" : color,
          opacity: visible ? 1 : 0,
          transition:
            "height .3s cubic-bezier(.22,1,.36,1), opacity .2s, background-image .2s"
        }}
      />
      <svg
        aria-hidden
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        style={{
          position: "absolute",
          left: 2,
          top: visible ? y - CORNER : 0,
          opacity: visible ? 1 : 0,
          transition: "top .3s cubic-bezier(.22,1,.36,1), opacity .2s",
          color: esActivo ? color : `color-mix(in srgb, ${color} 67%, transparent)`
        }}
      >
        <path
          d="M0.5 0a6 6 0 0 0 6 6H12"
          stroke="currentColor"
          strokeDasharray={dashed ? "2 2" : undefined}
        />
      </svg>

      <ul style={{ listStyle: "none", paddingLeft: 16 }}>
        {items.map((item, i) => {
          const activo = i === activeIndex;
          const enHover = i === hoverIndex;
          return (
            <li key={item.href} style={{ marginBottom: 18 }}>
              <Link
                to={item.href}
                ref={(el) => (itemRefs.current[i] = el)}
                onClick={onNavigate}
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                style={{
                  textDecoration: "none",
                  color: enHover || activo ? color : "#666",
                  fontWeight: activo ? 700 : 500,
                  fontSize: 17,
                  display: "inline-block",
                  padding: "4px 0",
                  transition: "color .2s, transform .2s",
                  transform: enHover ? "translateX(4px)" : "none"
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

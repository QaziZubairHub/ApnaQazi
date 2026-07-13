import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { getStatusColor } from "../../util/helpers";

const statuses = ["Pending", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];

const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const colors = getStatusColor(value);

  useEffect(() => {
    const handler = (e) => {
      const triggerEl = triggerRef.current;
      const menuEl = menuRef.current;
      if (triggerEl?.contains(e.target) || menuEl?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // Keep the exact same width and styling; only compute absolute viewport position.
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 1, // preserves the "below" feel while avoiding clipping
        left: rect.left,
        width: 176, // matches w-44
        zIndex: 50,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all hover:opacity-80 ${colors.bg} ${colors.text} ${colors.border}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {value}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white rounded-[12px] shadow-xl border border-slate-200 py-1.5"
            role="menu"
          >
            {statuses.map((s) => {
              const c = getStatusColor(s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors hover:bg-slate-50 ${
                    s === value ? "bg-slate-50" : ""
                  }`}
                  role="menuitem"
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={c.text}>{s}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default StatusDropdown;


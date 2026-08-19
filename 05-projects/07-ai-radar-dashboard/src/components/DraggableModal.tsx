"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minus, X } from "lucide-react";

type Pos = { x: number; y: number };

/**
 * 可拖动 / 可关闭 / 可最小化的通用弹窗。
 * 拖动标题栏移动；右上角提供「最小化」和「关闭」；最小化后变成右下角浮动胶囊。
 */
export function DraggableModal({
  open,
  onClose,
  title,
  hint,
  children,
  footer,
  width = 860,
  zIndex = 80,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  zIndex?: number;
}) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setMinimized(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function onHeaderMouseDown(e: React.MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    const panel = (e.currentTarget as HTMLElement).closest<HTMLElement>(".app-modal");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = dragRef.current.dx;
      const dy = dragRef.current.dy;
      const x = Math.min(Math.max(8, ev.clientX - dx), window.innerWidth - 80);
      const y = Math.min(Math.max(8, ev.clientY - dy), window.innerHeight - 60);
      setPos({ x, y });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const style: React.CSSProperties = {
    width: `min(${width}px, calc(100vw - 2rem))`,
    maxHeight: "min(86vh, 920px)",
    zIndex: zIndex + 1,
    ...(pos ? { position: "fixed" as const, left: pos.x, top: pos.y, transform: "none", margin: 0 } : {}),
  };

  if (minimized) {
    return (
      <div className="app-modal-min" style={{ zIndex: zIndex + 2 }}>
        <button type="button" className="app-modal-min-label" onClick={() => setMinimized(false)} title="展开">
          <Maximize2 size={13} aria-hidden />
          <span className="app-modal-min-title">{title}</span>
        </button>
        <button type="button" className="app-modal-min-btn" onClick={onClose} aria-label="关闭">
          <X size={14} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      className="app-modal-root"
      style={{ zIndex }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="app-modal" style={style} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "弹窗"}>
        <header
          className="app-modal-head"
          onMouseDown={onHeaderMouseDown}
          style={{ cursor: "move", touchAction: "none" }}
        >
          <div className="min-w-0">
            <h2 className="display app-modal-title">{title}</h2>
            {hint ? <p className="app-modal-hint">{hint}</p> : null}
          </div>
          <div className="app-modal-actions">
            <button type="button" className="app-modal-btn" onClick={() => setMinimized(true)} aria-label="最小化" title="最小化">
              <Minus size={16} aria-hidden />
            </button>
            <button type="button" className="app-modal-btn" onClick={onClose} aria-label="关闭" title="关闭">
              <X size={16} aria-hidden />
            </button>
          </div>
        </header>
        <div className="app-modal-body">{children}</div>
        {footer ? <footer className="app-modal-foot">{footer}</footer> : null}
      </section>
    </div>
  );
}

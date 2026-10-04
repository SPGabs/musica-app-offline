import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { haptic } from "@/lib/haptics";

const SPRING = "transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.42s cubic-bezier(0.32, 0.72, 0, 1)";
const AXIS = 12;
const DISMISS_PX = 120;
const DISMISS_VEL = 0.85;

function height() {
  return typeof window === "undefined" ? 800 : window.innerHeight;
}

export function useInteractiveSheet(open: boolean, onDismiss: () => void) {
  const [mounted, setMounted] = useState(open);
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; axis: "x" | "y" | null } | null>(null);
  const last = useRef<{ y: number; t: number }>({ y: 0, t: 0 });
  const dismissing = useRef(false);
  const dismissGen = useRef(0);
  const yRef = useRef(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  yRef.current = y;

  const dismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;
    const token = ++dismissGen.current;
    setDragging(false);
    setY(height());
    void haptic("light");
    window.setTimeout(() => {
      if (dismissGen.current !== token) return;
      onDismissRef.current();
      setMounted(false);
      setY(0);
      dismissing.current = false;
    }, 400);
  }, []);

  useEffect(() => {
    if (open) {
      const wasDismissing = dismissing.current;
      dismissGen.current += 1;
      dismissing.current = false;
      if (!mounted) {
        setMounted(true);
        setY(height());
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setY(0));
        });
      } else if (wasDismissing) {
        setY(0);
      }
      return;
    }
    if (mounted && !dismissing.current) dismiss();
  }, [open, mounted, dismiss]);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("input, button, a, textarea, [data-no-sheet-drag]")) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now(), axis: null };
    last.current = { y: e.clientY, t: Date.now() };
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < AXIS && Math.abs(dy) < AXIS) return;
      s.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      if (s.axis === "y") {
        setDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* capture is best-effort */
        }
      }
    }
    if (s.axis === "y") {
      const next = dy < 0 ? dy * 0.18 : dy;
      setY(next);
      last.current = { y: e.clientY, t: Date.now() };
    }
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const dt = Math.max(1, Date.now() - last.current.t);
      const vel = (e.clientY - last.current.y) / dt;
      if (s.axis === "y") {
        setDragging(false);
        if (yRef.current > DISMISS_PX || vel > DISMISS_VEL) dismiss();
        else setY(0);
        return { kind: "sheet" as const };
      }
      if (s.axis === "x" && Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy)) {
        return { kind: "skip" as const, dir: dx < 0 ? ("next" as const) : ("prev" as const) };
      }
      return { kind: "none" as const };
    },
    [dismiss],
  );

  const progress = Math.min(1, Math.max(0, y / height()));

  return {
    mounted,
    y,
    dragging,
    progress,
    dismiss,
    sheetStyle: {
      transform: `translate3d(0, ${Math.max(0, y)}px, 0)`,
      transition: dragging ? "none" : SPRING,
      willChange: "transform",
    } as CSSProperties,
    backdropStyle: {
      opacity: Math.max(0, 1 - progress * 1.15),
      transition: dragging ? "none" : SPRING,
    } as CSSProperties,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

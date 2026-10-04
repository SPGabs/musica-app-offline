import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { haptic } from "@/lib/haptics";

const TABS = new Set(["/", "/albums", "/playlists", "/search", "/settings"]);
const EDGE = 28;
const THRESHOLD = 72;

export function useEdgeSwipeBack(enabled: boolean) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const canPop = !TABS.has(pathname);

  useEffect(() => {
    if (!enabled || !canPop) return;
    let start: { x: number; y: number } | null = null;
    let locked = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.clientX > EDGE) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [data-no-back-swipe]")) return;
      start = { x: e.clientX, y: e.clientY };
      locked = false;
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!locked) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        locked = Math.abs(dx) > Math.abs(dy);
        if (!locked) start = null;
      }
    };
    const up = (e: PointerEvent) => {
      if (!start || !locked) {
        start = null;
        return;
      }
      const dx = e.clientX - start.x;
      start = null;
      if (dx > THRESHOLD) {
        void haptic("light");
        navigate(-1);
      }
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [enabled, canPop, navigate]);
}

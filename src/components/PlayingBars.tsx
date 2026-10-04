import { cn } from "@/lib/utils";

export function PlayingBars({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <div className={cn("eq", playing && "eq-on", className)} aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

import { Music } from "lucide-react";
import { useCoverUrl } from "@/providers/library";
import { cn } from "@/lib/utils";

interface CoverArtProps {
  songId?: number | null;
  className?: string;
  rounded?: string;
}

export function CoverArt({ songId, className, rounded = "rounded-lg" }: CoverArtProps) {
  const url = useCoverUrl(songId ?? null);
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0",
        rounded,
        className,
      )}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <Music className="h-1/2 w-1/2 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />
      )}
    </div>
  );
}

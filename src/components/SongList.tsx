import { Link } from "react-router";
import type { Song } from "@/lib/types";
import { usePlayer } from "@/providers/player";
import { CoverArt } from "./CoverArt";
import { SongActions } from "./SongActions";
import { LikeButton } from "./LikeButton";
import { PlayingBars } from "./PlayingBars";
import { formatTime } from "@/lib/audio";
import { artistHref, albumHref } from "@/lib/catalog";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface SongListProps {
  songs: Song[];
  showAlbum?: boolean;
}

export function SongList({ songs, showAlbum = true }: SongListProps) {
  const { playQueue, current, isPlaying, toggle } = usePlayer();

  return (
    <ul className="divide-y divide-black/5 dark:divide-white/10">
      {songs.map((song, i) => {
        const isCurrent = current?.id === song.id;
        return (
          <li
            key={song.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              void haptic(isCurrent ? "light" : "medium");
              if (isCurrent) toggle();
              else playQueue(songs, i);
            }}
            onKeyDown={(e) => e.key === "Enter" && (isCurrent ? toggle() : playQueue(songs, i))}
            className="press-row flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-2 lg:px-6"
          >
            <div className="relative">
              <CoverArt songId={song.id} className="h-11 w-11" rounded="rounded-md" />
              {isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                  {isPlaying ? (
                    <PlayingBars playing />
                  ) : (
                    <Play className="h-4 w-4 fill-white text-white" />
                  )}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-[15px]", isCurrent && "text-brand font-medium")}>
                {song.title}
              </p>
              <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                <Link
                  to={artistHref(song.artist)}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {song.artist}
                </Link>
                {showAlbum && song.album ? (
                  <>
                    {" — "}
                    <Link
                      to={albumHref(song.artist, song.album)}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {song.album}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <span className="text-[13px] tabular-nums text-neutral-400">
              {song.duration ? formatTime(song.duration) : ""}
            </span>
            <LikeButton song={song} className="w-9" />
            <SongActions song={song} />
          </li>
        );
      })}
    </ul>
  );
}

import { useRef, useState } from "react";
import { Heart, ImagePlus, ListPlus, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import type { Song } from "@/lib/types";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SongActions({ song }: { song: Song }) {
  const { playSong } = usePlayer();
  const { playlists, updateSong, removeSong, addToPlaylist, createPlaylist, setCover, toggleLike } =
    useLibrary();
  const [editOpen, setEditOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist ?? "");
  const [album, setAlbum] = useState(song.album ?? "");
  const [lyrics, setLyrics] = useState(song.lyrics ?? "");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [busy, setBusy] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const saveEdit = async () => {
    setBusy(true);
    try {
      await updateSong(song.id, {
        title: title.trim(),
        artist: artist.trim() || "Artista desconhecido",
        album: album.trim() || "Álbum desconhecido",
        lyrics: lyrics.trim() || null,
      });
      setEditOpen(false);
      toast.success("Música atualizada");
    } finally {
      setBusy(false);
    }
  };

  const addTo = async (playlistId: number) => {
    await addToPlaylist(playlistId, song.id);
    toast.success("Adicionada à playlist");
    setPlaylistOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Mais opções"
            className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 active:bg-black/5 dark:active:bg-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => playSong(song)}>
            <Play className="mr-2 h-4 w-4" /> Ouvir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void toggleLike(song.id)}>
            <Heart className="mr-2 h-4 w-4" /> {song.liked ? "Remover dos gostos" : "Gostar"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlaylistOpen(true)}>
            <ListPlus className="mr-2 h-4 w-4" /> Adicionar à playlist
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTitle(song.title);
              setArtist(song.artist ?? "");
              setAlbum(song.album ?? "");
              setLyrics(song.lyrics ?? "");
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Editar informações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => {
              if (window.confirm(`Apagar “${song.title}” da biblioteca?`)) {
                void removeSong(song.id).then(() => toast.success("Música apagada"));
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar informações</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artista" />
            <Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Álbum" />
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Letra (opcional)"
              rows={5}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => coverRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> Alterar capa
            </Button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void setCover(song.id, file).then(() => toast.success("Capa atualizada"));
              }}
            />
            <Button
              className="w-full bg-brand hover:opacity-90 text-white"
              disabled={!title.trim() || busy}
              onClick={() => void saveEdit()}
            >
              {busy ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={playlistOpen} onOpenChange={setPlaylistOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar à playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlists.length === 0 && (
              <p className="text-sm text-neutral-500 py-2">Ainda não há playlists.</p>
            )}
            {playlists.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => void addTo(p.id)}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-neutral-400">{p.count}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nova playlist…"
            />
            <Button
              size="icon"
              className="bg-brand text-white shrink-0"
              disabled={!newPlaylistName.trim()}
              onClick={() =>
                void (async () => {
                  const id = await createPlaylist(newPlaylistName.trim());
                  await addTo(id);
                  setNewPlaylistName("");
                })()
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

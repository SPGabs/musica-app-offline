import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  ChevronLeft,
  FileAudio,
  FolderOpen,
  Loader2,
  XCircle,
} from "lucide-react";
import { useLibrary } from "@/providers/library";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  probeDuration,
  readAudioTags,
  titleFromFileName,
} from "@/lib/audio";

interface ImportItem {
  id: number;
  file: File;
  title: string;
  artist?: string;
  album?: string;
  coverPreview?: string; // object URL temporária para a capa
  duration: number;
  status: "reading" | "saving" | "done" | "error";
  error?: string;
}

const ACCEPT = ".mp3,.m4a,.aac,.flac,.wav,.ogg,.oga,.opus,.aiff,.alac,audio/*";

export default function Upload() {
  const { saveSong } = useLibrary();
  const navigate = useNavigate();
  const [items, setItems] = useState<ImportItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const setItem = (id: number, patch: Partial<ImportItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const audioFiles = [...files].filter(
        (f) =>
          f.type.startsWith("audio/") ||
          /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|wma|aiff?|alac)$/i.test(f.name),
      );
      if (!audioFiles.length) return;

      const newItems: ImportItem[] = audioFiles.map((file) => ({
        id: ++idRef.current,
        file,
        title: titleFromFileName(file.name),
        duration: 0,
        status: "reading" as const,
      }));
      setItems((prev) => [...prev, ...newItems]);

      // lê metadados e guarda diretamente no IndexedDB (tudo local)
      for (const item of newItems) {
        try {
          const [tags, duration] = await Promise.all([
            readAudioTags(item.file),
            probeDuration(item.file),
          ]);
          const title = tags.title || titleFromFileName(item.file.name);
          setItem(item.id, {
            title,
            artist: tags.artist,
            album: tags.album,
            coverPreview: tags.coverBlob ? URL.createObjectURL(tags.coverBlob) : undefined,
            duration,
            status: "saving",
          });
          await saveSong({
            file: item.file,
            title,
            artist: tags.artist || "Artista desconhecido",
            album: tags.album || "Álbum desconhecido",
            duration,
            cover: tags.coverBlob ?? null,
          });
          setItem(item.id, { status: "done" });
        } catch (err) {
          setItem(item.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Falha ao guardar",
          });
        }
      }
    },
    [saveSong],
  );

  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pt-safe lg:hidden">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="flex h-11 items-center gap-1 text-brand -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[15px]">Voltar</span>
        </button>
      </div>
      <PageHeader
        title="Adicionar músicas"
        subtitle="Ficheiros locais — ficam guardados no dispositivo"
      />

      <div className="space-y-6 px-4 pt-2 lg:px-8">
        {/* Como funciona */}
        <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/10">
          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
            <div className="space-y-1 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="font-medium text-foreground">Onde estão as suas músicas?</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>No iPhone/iPad: guarde os ficheiros na app Ficheiros e escolha-os aqui.</li>
                <li>No computador: arraste ficheiros para esta janela.</li>
                <li>Nada é enviado para a internet — tudo fica guardado neste dispositivo.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Zona de largar ficheiros */}
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-[var(--brand)] bg-[var(--brand)]/5"
              : "border-neutral-300 dark:border-neutral-700",
          )}
        >
          <FileAudio className="h-10 w-10 text-brand" />
          <div>
            <p className="text-[15px] font-medium">Escolher na app Ficheiros</p>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
              ou arraste ficheiros para aqui — MP3, M4A, AAC, FLAC, WAV, OGG
            </p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Fila */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {done} de {items.length} adicionadas
            </p>
            <ul className="divide-y divide-black/5 rounded-2xl bg-black/[0.03] dark:divide-white/10 dark:bg-white/5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {item.coverPreview ? (
                    <img
                      src={item.coverPreview}
                      alt=""
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-700">
                      <FileAudio className="h-5 w-5 text-neutral-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{item.title}</p>
                    <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                      {item.artist ??
                        (item.status === "reading" ? "A ler…" : "Artista desconhecido")}{" "}
                      · {formatBytes(item.file.size)}
                      {item.status === "error" && (
                        <span className="text-red-500"> — {item.error}</span>
                      )}
                    </p>
                  </div>
                  {item.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {item.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                  {(item.status === "reading" || item.status === "saving") && (
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

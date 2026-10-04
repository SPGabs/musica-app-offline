import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Song } from "@/lib/types";
import { getAudioUrl, getCoverUrl } from "@/lib/localdb";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  current: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  nowPlayingOpen: boolean;
  playQueue: (songs: Song[], startIndex?: number) => void;
  playSong: (song: Song) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  audioUrl: string | null;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [volume, setVolumeState] = useState(1);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const current = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Cria o elemento de áudio uma única vez
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      nextRef.current(true);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    const onError = () => setIsPlaying(false);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Carrega e toca sempre que a música atual muda
  const currentId = current?.id ?? null;
  useEffect(() => {
    const audio = audioRef.current;
    const song = audio && currentId != null ? current : null;
    if (!audio || !song) return;
    let cancelled = false;
    setProgress(0);
    setDuration(song.duration || 0);
    void getAudioUrl(song.id).then((url) => {
      if (cancelled || !url) return;
      setAudioUrl(url);
      audio.src = url;
      void audio.play().catch(() => setIsPlaying(false));
    });

    // Metadados para o ecrã de bloqueio / Central de Controlo
    if ("mediaSession" in navigator) {
      void getCoverUrl(song.id).then((cover) => {
        if (cancelled || !("mediaSession" in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist ?? "",
          album: song.album ?? "",
          artwork: cover ? [{ src: cover, sizes: "512x512", type: "image/jpeg" }] : [],
        });
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const next = useCallback(
    (auto = false) => {
      setCurrentIndex((idx) => {
        if (queue.length === 0) return -1;
        if (shuffleRef.current) {
          if (queue.length === 1) return 0;
          let n = idx;
          while (n === idx) n = Math.floor(Math.random() * queue.length);
          return n;
        }
        const n = idx + 1;
        if (n >= queue.length) {
          if (repeatRef.current === "all" || !auto) return 0;
          // repeat desligado + fim natural: parar
          audioRef.current?.pause();
          return idx;
        }
        return n;
      });
    },
    [queue.length],
  );
  const nextRef = useRef(next);
  nextRef.current = next;

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : 0));
  }, []);

  const playQueue = useCallback((songs: Song[], startIndex = 0) => {
    if (!songs.length) return;
    setQueue(songs);
    setCurrentIndex(startIndex);
  }, []);

  const playSong = useCallback((song: Song) => {
    setQueue((q) => {
      const idx = q.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        return q;
      }
      setCurrentIndex(0);
      return [song];
    });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }, [current]);

  const seek = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = sec;
    setProgress(sec);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  // Controlos Media Session (ecrã de bloqueio, Central de Controlo)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current(false));
  }, [prev]);

  const value = useMemo<PlayerState>(
    () => ({
      queue,
      currentIndex,
      current,
      isPlaying,
      progress,
      duration,
      shuffle,
      repeat,
      volume,
      nowPlayingOpen,
      playQueue,
      playSong,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      setNowPlayingOpen,
      audioUrl,
    }),
    [
      queue, currentIndex, current, isPlaying, progress, duration, shuffle,
      repeat, volume, nowPlayingOpen, playQueue, playSong, toggle, next, prev,
      seek, setVolume, toggleShuffle, cycleRepeat, audioUrl,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

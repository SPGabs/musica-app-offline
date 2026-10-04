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
import { toast } from "sonner";
import type { RepeatMode, Song } from "@/lib/types";
import { getAudioUrl, getCoverUrl } from "@/lib/localdb";
import { isAwkwardOnIOS } from "@/lib/mime";
import { loadPlayerState, savePlayerState } from "@/lib/persist";
import { primeAudioElement } from "@/lib/unlock-audio";
import { isAppleTouchDevice } from "@/lib/device";
import { useLibrary } from "./library";

function wireAudioElement(audio: HTMLAudioElement) {
  audio.preload = "auto";
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.controls = false;
  audio.style.display = "none";
  document.body.appendChild(audio);
}

function waitCanPlay(audio: HTMLAudioElement, timeoutMs = 8000): Promise<void> {
  if (audio.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Falha ao carregar o áudio"));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onErr);
    };
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("error", onErr, { once: true });
  });
}

async function startPlayback(audio: HTMLAudioElement, speed: number, volume: number) {
  audio.volume = volume;
  audio.playbackRate = 1;
  await audio.play();
  audio.playbackRate = speed;
}

const SPEEDS = [0.8, 1, 1.25, 1.5, 2];

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
  speed: number;
  crossfade: number;
  nowPlayingOpen: boolean;
  queueOpen: boolean;
  playQueue: (songs: Song[], startIndex?: number) => void;
  playSong: (song: Song) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  setSpeed: (v: number) => void;
  cycleSpeed: () => void;
  setCrossfade: (sec: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  audioUrl: string | null;
}

const PlayerContext = createContext<PlayerState | null>(null);

function applyRateAndVolume(audio: HTMLAudioElement, speed: number, volume: number) {
  audio.playbackRate = speed;
  audio.volume = volume;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { songs, ready, markPlayed } = useLibrary();
  const primaryRef = useRef<HTMLAudioElement | null>(null);
  const secondaryRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<HTMLAudioElement | null>(null);
  const fadingRef = useRef(false);
  const skipPlayRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const lastMarkedRef = useRef<number | null>(null);
  const bindLockRef = useRef<() => void>(() => {});

  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [volume, setVolumeState] = useState(1);
  const [speed, setSpeedState] = useState(1);
  const [crossfade, setCrossfadeState] = useState(0);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const crossfadeRef = useRef(crossfade);
  crossfadeRef.current = crossfade;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  const current = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  useEffect(() => {
    const a = document.createElement("audio");
    const b = document.createElement("audio");
    wireAudioElement(a);
    wireAudioElement(b);
    primaryRef.current = a;
    secondaryRef.current = b;
    activeRef.current = a;

    const bind = (audio: HTMLAudioElement) => {
      const onTime = () => {
        if (activeRef.current !== audio) return;
        setProgress(audio.currentTime);
        const fade = crossfadeRef.current;
        if (
          fade > 0 &&
          !fadingRef.current &&
          audio.duration &&
          audio.duration - audio.currentTime <= fade &&
          repeatRef.current !== "one"
        ) {
          fadingRef.current = true;
          nextRef.current(true);
        }
      };
      const onDur = () => {
        if (activeRef.current === audio) setDuration(audio.duration || 0);
      };
      const onPlay = () => {
        if (activeRef.current === audio) setIsPlaying(true);
      };
      const onPause = () => {
        if (activeRef.current === audio) setIsPlaying(false);
      };
      const onEnded = () => {
        if (activeRef.current !== audio) return;
        if (repeatRef.current === "one") {
          audio.currentTime = 0;
          void startPlayback(audio, speedRef.current, volumeRef.current).catch(() => undefined);
          return;
        }
        if (fadingRef.current) return;
        nextRef.current(true);
      };
      const onError = () => {
        if (activeRef.current === audio) setIsPlaying(false);
      };
      audio.addEventListener("timeupdate", onTime);
      audio.addEventListener("durationchange", onDur);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);
      return () => {
        audio.pause();
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("durationchange", onDur);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.remove();
      };
    };
    const ua = bind(a);
    const ub = bind(b);
    return () => {
      ua();
      ub();
    };
  }, []);

  const currentId = current?.id ?? null;

  useEffect(() => {
    const audio = activeRef.current;
    const song = audio && currentId != null ? current : null;
    if (!audio || !song) return;
    let cancelled = false;
    const incoming = activeRef.current === primaryRef.current ? secondaryRef.current : primaryRef.current;
    const shouldPlay = !skipPlayRef.current;
    const seekTo = pendingSeekRef.current;
    skipPlayRef.current = false;
    pendingSeekRef.current = null;
    setProgress(seekTo ?? 0);
    setDuration(song.duration || 0);

    const fail = (err?: unknown) => {
      if (cancelled) return;
      setIsPlaying(false);
      if (!shouldPlay) return;
      const awkward = isAwkwardOnIOS(song.fileName) && isAppleTouchDevice();
      toast.error(
        awkward
          ? "Este formato (FLAC/OGG) não toca no iPhone/iPad. Converta para MP3 ou M4A."
          : "Não foi possível reproduzir esta música.",
      );
      console.warn("playback failed", err);
    };

    void getAudioUrl(song.id)
      .then(async (url) => {
        if (cancelled) return;
        if (!url) throw new Error("Áudio não encontrado");
        setAudioUrl(url);
        const fade = crossfadeRef.current;
        const outgoing = activeRef.current;
        const useFade = !!(fade > 0 && shouldPlay && outgoing && !outgoing.paused && incoming && outgoing.src);

        if (useFade && incoming && outgoing) {
          incoming.src = url;
          incoming.load();
          incoming.volume = 0;
          incoming.playbackRate = 1;
          try {
            await waitCanPlay(incoming);
            if (cancelled) return;
            await startPlayback(incoming, speedRef.current, 0);
          } catch (err) {
            outgoing.pause();
            activeRef.current = incoming;
            incoming.volume = volumeRef.current;
            fail(err);
            return;
          }
          const steps = 20;
          const stepMs = (fade * 1000) / steps;
          for (let i = 1; i <= steps; i++) {
            if (cancelled) return;
            const t = i / steps;
            incoming.volume = volumeRef.current * t;
            outgoing.volume = volumeRef.current * (1 - t);
            await new Promise((r) => setTimeout(r, stepMs));
          }
          outgoing.pause();
          outgoing.removeAttribute("src");
          outgoing.load();
          incoming.volume = volumeRef.current;
          incoming.playbackRate = speedRef.current;
          activeRef.current = incoming;
          fadingRef.current = false;
        } else {
          audio.src = url;
          audio.load();
          audio.volume = volumeRef.current;
          audio.playbackRate = 1;
          try {
            await waitCanPlay(audio);
            if (cancelled) return;
            if (seekTo && seekTo > 0 && Number.isFinite(audio.duration)) {
              audio.currentTime = seekTo;
              setProgress(seekTo);
            }
            if (shouldPlay) await startPlayback(audio, speedRef.current, volumeRef.current);
            else audio.pause();
          } catch (err) {
            fail(err);
          }
          fadingRef.current = false;
        }
      })
      .catch(fail);

    if ("mediaSession" in navigator) {
      void getCoverUrl(song.id).then((cover) => {
        if (cancelled || !("mediaSession" in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist ?? "",
          album: song.album ?? "",
          artwork: cover ? [{ src: cover, sizes: "512x512", type: "image/jpeg" }] : [],
        });
        bindLockRef.current();
      });
    }

    if (shouldPlay && lastMarkedRef.current !== song.id) {
      lastMarkedRef.current = song.id;
      void markPlayed(song.id);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const next = useCallback(
    (auto = false) => {
      setCurrentIndex((idx) => {
        const q = queueRef.current;
        if (q.length === 0) return -1;
        if (shuffleRef.current) {
          if (q.length === 1) return 0;
          let n = idx;
          while (n === idx) n = Math.floor(Math.random() * q.length);
          return n;
        }
        const n = idx + 1;
        if (n >= q.length) {
          if (repeatRef.current === "all" || !auto) return 0;
          activeRef.current?.pause();
          fadingRef.current = false;
          return idx;
        }
        return n;
      });
    },
    [],
  );
  const nextRef = useRef(next);
  nextRef.current = next;

  const prev = useCallback(() => {
    const audio = activeRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : 0));
  }, []);

  const playQueue = useCallback((list: Song[], startIndex = 0) => {
    if (!list.length) return;
    primeAudioElement(activeRef.current);
    skipPlayRef.current = false;
    setQueue(list);
    setCurrentIndex(startIndex);
  }, []);

  const playSong = useCallback((song: Song) => {
    primeAudioElement(activeRef.current);
    skipPlayRef.current = false;
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

  const playAt = useCallback((index: number) => {
    primeAudioElement(activeRef.current);
    skipPlayRef.current = false;
    setCurrentIndex(index);
  }, []);

  const toggle = useCallback(() => {
    const audio = activeRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      primeAudioElement(audio);
      void startPlayback(audio, speedRef.current, volumeRef.current).catch(() => {
        setIsPlaying(false);
        toast.error("Não foi possível reproduzir esta música.");
      });
    } else audio.pause();
  }, [current]);

  const seek = useCallback((sec: number) => {
    const audio = activeRef.current;
    if (!audio) return;
    audio.currentTime = sec;
    setProgress(sec);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = activeRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const setSpeed = useCallback((v: number) => {
    const audio = activeRef.current;
    if (audio) audio.playbackRate = v;
    setSpeedState(v);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedState((cur) => {
      const i = SPEEDS.indexOf(cur);
      const nextSpeed = SPEEDS[(i + 1) % SPEEDS.length] ?? 1;
      if (activeRef.current) activeRef.current.playbackRate = nextSpeed;
      return nextSpeed;
    });
  }, []);

  const setCrossfade = useCallback((sec: number) => setCrossfadeState(sec), []);

  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      const nextOn = !on;
      if (nextOn) {
        setQueue((q) => {
          const idx = indexRef.current;
          if (q.length < 2) return q;
          const currentSong = q[idx];
          const rest = q.filter((_, i) => i !== idx);
          for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }
          setCurrentIndex(0);
          return currentSong ? [currentSong, ...rest] : rest;
        });
      }
      return nextOn;
    });
  }, []);

  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  const bindLockScreenControls = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => {
      const audio = activeRef.current;
      if (!audio) return;
      void startPlayback(audio, speedRef.current, volumeRef.current).catch(() => undefined);
    });
    ms.setActionHandler("pause", () => activeRef.current?.pause());
    ms.setActionHandler("previoustrack", prev);
    ms.setActionHandler("nexttrack", () => nextRef.current(false));
    ms.setActionHandler("seekto", (e) => {
      if (typeof e.seekTime === "number") seek(e.seekTime);
    });
    // No iOS estes dois substituem anterior/próxima na lock screen e nos widgets.
    ms.setActionHandler("seekbackward", null);
    ms.setActionHandler("seekforward", null);
  }, [prev, seek]);
  bindLockRef.current = bindLockScreenControls;

  useEffect(() => {
    bindLockScreenControls();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [bindLockScreenControls, currentId, isPlaying]);

  useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadPlayerState();
    if (!saved) return;
    setShuffle(saved.shuffle);
    setRepeat(saved.repeat);
    setVolumeState(saved.volume);
    setSpeedState(saved.speed);
    setCrossfadeState(saved.crossfade);
    if (activeRef.current) applyRateAndVolume(activeRef.current, saved.speed, saved.volume);
    const q = saved.queueIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => !!s);
    if (!q.length) return;
    skipPlayRef.current = true;
    pendingSeekRef.current = saved.progress;
    setQueue(q);
    setCurrentIndex(Math.min(Math.max(0, saved.index), q.length - 1));
  }, [ready, songs]);

  useEffect(() => {
    setQueue((q) => {
      if (!q.length) return q;
      const map = new Map(songs.map((s) => [s.id, s]));
      const nextQ = q.map((s) => map.get(s.id)).filter((s): s is Song => !!s);
      if (nextQ.length === q.length && nextQ.every((s, i) => s === q[i])) return q;
      if (nextQ.length !== q.length) {
        setCurrentIndex((idx) => {
          if (!nextQ.length) return -1;
          const curId = q[idx]?.id;
          const ni = nextQ.findIndex((s) => s.id === curId);
          return ni >= 0 ? ni : 0;
        });
      }
      return nextQ;
    });
  }, [songs]);

  useEffect(() => {
    if (!queue.length || currentIndex < 0) return;
    const t = window.setTimeout(() => {
      savePlayerState({
        queueIds: queue.map((s) => s.id),
        index: currentIndex,
        progress,
        shuffle,
        repeat,
        volume,
        speed,
        crossfade,
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [queue, currentIndex, progress, shuffle, repeat, volume, speed, crossfade]);

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
      speed,
      crossfade,
      nowPlayingOpen,
      queueOpen,
      playQueue,
      playSong,
      playAt,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      setSpeed,
      cycleSpeed,
      setCrossfade,
      toggleShuffle,
      cycleRepeat,
      setNowPlayingOpen,
      setQueueOpen,
      audioUrl,
    }),
    [
      queue, currentIndex, current, isPlaying, progress, duration, shuffle, repeat,
      volume, speed, crossfade, nowPlayingOpen, queueOpen, playQueue, playSong, playAt,
      toggle, next, prev, seek, setVolume, setSpeed, cycleSpeed, setCrossfade,
      toggleShuffle, cycleRepeat, audioUrl,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

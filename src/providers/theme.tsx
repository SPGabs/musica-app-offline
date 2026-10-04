import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const ACCENTS = [
  { id: "red", label: "Vermelho", value: "#fa2d48" },
  { id: "orange", label: "Laranja", value: "#ff9500" },
  { id: "yellow", label: "Amarelo", value: "#ffcc00" },
  { id: "green", label: "Verde", value: "#34c759" },
  { id: "teal", label: "Azul-petróleo", value: "#30b0c7" },
  { id: "blue", label: "Azul", value: "#007aff" },
  { id: "purple", label: "Roxo", value: "#af52de" },
  { id: "pink", label: "Rosa", value: "#ff2d92" },
] as const;

export type Appearance = "light" | "dark" | "auto";

interface ThemeState {
  accent: string;
  setAccent: (v: string) => void;
  appearance: Appearance;
  setAppearance: (v: Appearance) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const ACCENT_KEY = "player.accent";
const APPEARANCE_KEY = "player.appearance";

function applyDark(appearance: Appearance) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = appearance === "dark" || (appearance === "auto" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível (modo privado, etc.) */
  }
}

export function PlayerThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<string>(
    () => readStorage(ACCENT_KEY, ACCENTS[0].value),
  );
  const [appearance, setAppearanceState] = useState<Appearance>(
    () => (readStorage(APPEARANCE_KEY, "auto") as Appearance) || "auto",
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", accent);
    writeStorage(ACCENT_KEY, accent);
  }, [accent]);

  useEffect(() => {
    applyDark(appearance);
    writeStorage(APPEARANCE_KEY, appearance);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => appearance === "auto" && applyDark(appearance);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance]);

  const setAccent = useCallback((v: string) => setAccentState(v), []);
  const setAppearance = useCallback((v: Appearance) => setAppearanceState(v), []);

  const value = useMemo(
    () => ({ accent, setAccent, appearance, setAppearance }),
    [accent, appearance, setAccent, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePlayerTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("usePlayerTheme must be used within PlayerThemeProvider");
  return ctx;
}

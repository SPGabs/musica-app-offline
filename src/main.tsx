import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js", { scope: "./" })
  })
}

// HashRouter: funciona offline em qualquer contexto (Capacitor, ficheiro local, PWA)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

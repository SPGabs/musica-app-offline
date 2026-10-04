/* Cache da app-shell para PWA no GitHub Pages / Safari iOS. */
const CACHE = "musica-shell-v2";
const PRECACHE = ["./index.html", "./manifest.webmanifest", "./favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload", redirect: "follow" });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* primeira visita sem rede: ignora */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      try {
        const res = await fetch(req);
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          const cache = await caches.open(CACHE);
          await cache.put(req, copy);
        }
        return res;
      } catch {
        if (cached) return cached;
        if (req.mode === "navigate") {
          return (await caches.match("./index.html")) || Response.error();
        }
        return Response.error();
      }
    })(),
  );
});

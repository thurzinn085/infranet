// InfraNet — service worker minimo.
// Objetivo: permitir instalacao como PWA e um cache basico do "shell" da
// aplicacao (paginas estaticas de login/erro). Nao armazena em cache
// respostas da API (/api/*), pois esses dados sao autenticados e mudam
// com frequencia — cachear isso poderia mostrar dados desatualizados ou
// de outro usuario.

const CACHE_NAME = "infranet-shell-v1";
const SHELL_URLS = ["/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca intercepta chamadas de API — sempre vao direto para a rede.
  if (url.pathname.startsWith("/api/")) return;

  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

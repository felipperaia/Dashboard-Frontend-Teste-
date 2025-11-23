// public/sw.js
const CACHE_NAME = "silo-static-v1";
const API_CACHE = "silo-api-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/static/js/bundle.js",
  "/static/css/main.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME && k !== API_CACHE ? caches.delete(k) : Promise.resolve())
      ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições não GET e não HTTP/HTTPS
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }
  
  // Ignorar requisições POST para evitar erro de cache
  if (event.request.method === 'POST') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    // Network First for API - mas não cachear POST
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Só cachear se for uma resposta válida e método GET
          if (res.status === 200 && event.request.method === 'GET') {
            const copy = res.clone();
            caches.open(API_CACHE)
              .then(cache => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache First for assets
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
  );
});

self.addEventListener("push", function(event) {
  let data = {};
  try { 
    data = event.data.json(); 
  } catch(e) {
    console.warn("Push data não é JSON:", e);
    data = { title: "Silo Monitor", body: event.data.text() || "Nova notificação" };
  }
  
  const title = data.title || "Silo Monitor";
  const options = { 
    body: data.body || "Nova notificação", 
    icon: "/icon-192.png",
    badge: "/icon-72.png"
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(err => console.error("Erro ao mostrar notificação:", err))
  );
});

// Clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
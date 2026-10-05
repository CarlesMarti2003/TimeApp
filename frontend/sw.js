const CACHE_NAME = 'timeapp-v5';
const assets = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Instalación: Guarda los archivos y fuerza a que esta versión tome el control
self.addEventListener('install', event => {
    self.skipWaiting(); // <-- Esto obliga al SW a instalarse sin esperar
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(assets);
        })
    );
});

// Activación: Borra cualquier caché de versiones anteriores (v1, v2)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key)) // <-- Borra la memoria antigua
            );
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    if (!event.request.url.includes('5000') && !event.request.url.includes('pythonanywhere')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});
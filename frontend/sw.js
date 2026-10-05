const CACHE_NAME = 'timeapp-v1';
const assets = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Instalación: Guarda los archivos estáticos en caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(assets);
        })
    );
});

// Interceptar peticiones: Sirve la caché para la interfaz, pero deja pasar las peticiones a tu API en Python
self.addEventListener('fetch', event => {
    // Evitamos interceptar las llamadas a nuestro backend (localhost:5000)
    if (!event.request.url.includes('5000')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});
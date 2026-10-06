// ==========================================
// 1. CONFIGURACIÓN DE CACHÉ
// ==========================================
const CACHE_NAME = 'timeapp-v0.0.1'; 
const assets = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// ==========================================
// 2. INSTALACIÓN (Guardar en caché)
// ==========================================
self.addEventListener('install', event => {
    // Obliga al Service Worker a instalarse y tomar el control sin esperar
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(assets);
        })
    );
});

// ==========================================
// 3. ACTIVACIÓN (Limpiar caché antigua)
// ==========================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            // Filtra y borra cualquier caché que no coincida con la versión actual (v6)
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key)) 
            );
        })
    );
});

// ==========================================
// 4. INTERCEPCIÓN DE PETICIONES (Modo Offline)
// ==========================================
self.addEventListener('fetch', event => {
    // Excluimos las llamadas a la API del backend para obtener siempre datos reales
    if (!event.request.url.includes('5000') && !event.request.url.includes('pythonanywhere')) {
        event.respondWith(
            // Estrategia Cache-First para los archivos visuales de la PWA
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});
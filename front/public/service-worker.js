// public/service-worker.js

const CACHE_NAME = 'olympus-v1';

// ── INSTALL: cacheia o shell do app ──────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll(['/', '/index.html'])
        )
    );
    self.skipWaiting();
});

// ── ACTIVATE: limpa caches antigas ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── FETCH: cache-first para estáticos, network-first para API ───────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignora requisições não-GET e chamadas de API (outro domínio ou /api)
    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // Navegação (SPA): tenta rede, cai no index.html em caso de offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Estáticos (JS, CSS, imagens): cache-first
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            });
        })
    );
});

// ── TIMER DE DESCANSO ────────────────────────────────────────────────────────
let timerTimeoutId = null;

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SCHEDULE_TIMER') {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        const delay = event.data.delay; // ms
        timerTimeoutId = setTimeout(() => {
            timerTimeoutId = null;
            self.registration.showNotification('Olympus — Descanso concluído', {
                body: 'Hora da próxima série! 💪',
                icon: '/icons/logo-192.png',
                badge: '/icons/logo-192.png',
                tag: 'timer-descanso',
                renotify: true,
                vibrate: [200, 100, 200, 100, 200],
            });
        }, delay);
    }

    if (event.data?.type === 'CANCEL_TIMER') {
        if (timerTimeoutId) {
            clearTimeout(timerTimeoutId);
            timerTimeoutId = null;
        }
    }

    if (event.data?.type === 'SHOW_TIMER_NOTIFICATION') {
        if (timerTimeoutId) {
            clearTimeout(timerTimeoutId);
            timerTimeoutId = null;
        }
        self.registration.showNotification('Olympus — Descanso concluído', {
            body: 'Hora da próxima série! 💪',
            icon: '/icons/logo-192.png',
            badge: '/icons/logo-192.png',
            tag: 'timer-descanso',
            renotify: true,
            vibrate: [200, 100, 200, 100, 200],
        });
    }
});

self.addEventListener('push', (event) => {
    let data = { title: 'Olympus', body: 'Nova notificação', url: '/' };
    try { data = event.data.json(); } catch (_) {}
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/logo-192.png',
            badge: '/icons/logo-192.png',
            data: { url: data.url || '/' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});

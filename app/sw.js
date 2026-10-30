// Service worker mínimo: só torna o Steve instalável (Windows/Android/Chrome). Não guarda nada em cache —
// o app depende do servidor (login, créditos, pagamentos), então toda requisição vai direto à rede.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

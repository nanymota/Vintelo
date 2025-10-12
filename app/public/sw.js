// Service Worker para notificações push
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação da Vintélo',
        icon: '/imagens/logo.png',
        badge: '/imagens/brilhoescuro.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Vintélo', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
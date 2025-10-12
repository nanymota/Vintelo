// Sistema de notificações push usando Service Worker
class PushNotifications {
    constructor() {
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado');
                
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.subscribeUser(registration);
                }
            } catch (error) {
                console.log('Erro ao registrar Service Worker:', error);
            }
        }
    }

    async subscribeUser(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('sua_chave_publica_aqui')
            });

            // Salvar subscription no servidor usando rota existente
            await fetch('/salvar-push-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription })
            });
        } catch (error) {
            console.log('Erro ao subscrever push:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Mostrar notificação local
    showNotification(title, message) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/imagens/logo.png',
                badge: '/imagens/brilhoescuro.png'
            });
        }
    }
}

// Inicializar se usuário estiver logado
if (window.isAuthenticated) {
    new PushNotifications();
}
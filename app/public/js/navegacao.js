// Sistema de navegação inteligente
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        // Interceptar cliques nas setas de voltar
        document.addEventListener('DOMContentLoaded', () => {
            this.setupBackButtons();
        });
    }

    setupBackButtons() {
        // Selecionar todos os tipos de setas de voltar
        const selectors = [
            '.back-btn',
            '.seta-voltar', 
            'a[href="/"]',
            'a[href="/homecomprador"]',
            'a img[src*="seta"]',
            'a img[alt*="Voltar"]',
            'a img[alt*="Seta"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Se for uma imagem, pegar o link pai
                const linkElement = element.tagName === 'IMG' ? element.closest('a') : element;
                if (linkElement && linkElement.tagName === 'A') {
                    linkElement.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.goBack();
                    });
                }
            });
        });
    }

    goBack() {
        // Verificar se há histórico válido
        if (window.history.length > 1 && document.referrer && !document.referrer.includes('index')) {
            window.history.back();
        } else {
            // Redirecionar baseado no status de login
            this.redirectToHome();
        }
    }

    redirectToHome() {
        // Verificar se usuário está logado
        if (window.isAuthenticated) {
            // Verificar tipo de usuário
            const userType = this.getUserType();
            switch(userType) {
                case 'b':
                    window.location.href = '/homevendedor';
                    break;
                case 'a':
                    window.location.href = '/homeadm';
                    break;
                default:
                    window.location.href = '/homecomprador';
            }
        } else {
            window.location.href = '/';
        }
    }

    getUserType() {
        // Tentar obter do sessionStorage ou variável global
        return window.userType || sessionStorage.getItem('userType') || 'c';
    }
}

// Inicializar o sistema
new NavigationManager();

// Função global para navegação (compatibilidade)
function goBack() {
    if (window.history.length > 1 && document.referrer && !document.referrer.includes('index')) {
        window.history.back();
    } else {
        if (window.isAuthenticated) {
            const userType = window.userType || sessionStorage.getItem('userType') || 'c';
            switch(userType) {
                case 'b':
                    window.location.href = '/homevendedor';
                    break;
                case 'a':
                    window.location.href = '/homeadm';
                    break;
                default:
                    window.location.href = '/homecomprador';
            }
        } else {
            window.location.href = '/';
        }
    }
}
// Sistema de autenticação centralizado
(function() {
    let authCache = null;
    let cacheTime = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    async function fetchAuthStatus() {
        const now = Date.now();
        if (authCache && (now - cacheTime) < CACHE_DURATION) {
            return authCache;
        }

        try {
            const response = await fetch('/api/auth-status');
            const data = await response.json();
            
            authCache = data;
            cacheTime = now;
            
            // Compatibilidade com código legado
            window.isAuthenticated = data.autenticado || false;
            window.userType = data.tipo || 'c';
            
            return data;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return { autenticado: false, tipo: null };
        }
    }

    // API pública
    window.PerfilAutenticado = {
        async isAuthenticated() {
            const auth = await fetchAuthStatus();
            return auth.autenticado || false;
        },

        async getUserType() {
            const auth = await fetchAuthStatus();
            return auth.tipo || 'c';
        },

        async getUserData() {
            return await fetchAuthStatus();
        },

        clearCache() {
            authCache = null;
            cacheTime = 0;
        }
    };

    // Inicialização automática
    fetchAuthStatus();
})();
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
            window.isAuthenticated = data.isAuthenticated || false;
            window.userType = data.user?.tipo || 'c';
            
            // Atualizar imagens de perfil se autenticado
            if (data.isAuthenticated) {
                updateProfileImages(data);
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return { autenticado: false, tipo: null };
        }
    }

    // Atualizar imagens de perfil na página
    function updateProfileImages(userData) {
        const profileImages = document.querySelectorAll('.user-profile-img, .maria');
        const defaultImage = '/imagens/icone sem cadastro.png';
        const userImage = userData.user?.imagem || defaultImage;
        
        profileImages.forEach(img => {
            img.src = userImage.startsWith('/') ? userImage : '/' + userImage;
        });
    }

    // API pública
    window.PerfilAutenticado = {
        async isAuthenticated() {
            const auth = await fetchAuthStatus();
            return auth.isAuthenticated || false;
        },

        async getUserType() {
            const auth = await fetchAuthStatus();
            return auth.user?.tipo || 'c';
        },

        async getUserData() {
            const auth = await fetchAuthStatus();
            if (auth.isAuthenticated) {
                updateProfileImages(auth);
            }
            return auth;
        },

        clearCache() {
            authCache = null;
            cacheTime = 0;
        }
    };

    // Inicialização automática
    fetchAuthStatus();
})();
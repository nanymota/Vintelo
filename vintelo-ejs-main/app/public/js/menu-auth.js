// Script para atualizar menu mobile após autenticação
function updateMobileMenu(userData) {
    const profileSection = document.querySelector('.profile-section');
    const sidebarMenu = document.querySelector('.sidebar-menu ul');
    
    if (profileSection && userData) {
        // Atualizar seção de perfil
        profileSection.innerHTML = `
            <img src="${userData.imagem || 'imagens/imagem sem cadastro.avif'}" alt="${userData.nome}" class="profile-pic">
            <section class="profile-info">
                <h2>${userData.nome}</h2>
                <p class="user-email">${userData.email}</p>
            </section>
        `;
        
        // Atualizar menu lateral
        if (sidebarMenu) {
            sidebarMenu.innerHTML = `
                <li><a href="/informacao"><img src="imagens/icone informação.png">Informação da conta</a></li>
                <li><a href="/favoritos"><img src="imagens/coração de fav.png">Favoritos</a></li>
                <li><a href="/sacola1"><img src="imagens/icone sacola.png">Sacola</a></li>
                <li><a href="/minhascompras"><img src="imagens/caminhao.png">Minhas compras</a></li>
                <li><a href="#"><img src="imagens/cartao.png">Meus cartões</a></li>
                <li><a href="/blog"><img src="imagens/icone blog.png">Blog</a></li>
                <li><a href="/sair"><img src="imagens/sair.png">Sair</a></li>
            `;
        }
        
        // Atualizar ícone do header mobile
        const headerProfileIcon = document.querySelector('.grid a:last-child img');
        if (headerProfileIcon) {
            headerProfileIcon.src = userData.imagem || 'imagens/imagem sem cadastro.avif';
            headerProfileIcon.parentElement.href = '/perfilcliente';
        }
    }
}

// Verificar se há dados de usuário no localStorage (após cadastro)
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateMobileMenu(user);
            localStorage.removeItem('userData'); // Limpar após usar
        } catch (error) {
            console.error('Erro ao processar dados do usuário:', error);
        }
    }
});

// Função para ser chamada após cadastro bem-sucedido
function onUserRegistered(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
    updateMobileMenu(userData);
}
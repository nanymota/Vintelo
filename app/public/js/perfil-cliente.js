// Perfil Cliente
class PerfilCliente {
    constructor() {
        this.userData = null;
        this.favoritesList = [];
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.populateUserData();
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/auth-status');
            if (response.ok) {
                const data = await response.json();
                if (data.isAuthenticated) {
                    this.userData = data.user;
                    await this.loadFavorites();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.setFallbackData();
        }
    }

    async loadFavorites() {
        try {
            const response = await fetch('/api/favoritos');
            if (response.ok) {
                this.favoritesList = await response.json();
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            this.favoritesList = [];
        }
    }

    setFallbackData() {
        this.userData = {
            nome: 'Maria Silva',
            email: 'maria.silva@email.com',
            telefone: '(11) 99999-9999',
            imagem: '/imagens/icone sem cadastro.png',
            compras: 12,
            favoritos: 5,
            avaliacoes: 3,
            bio: 'Apaixonada por moda sustentável e peças únicas!',
            logradouro: 'Rua das Flores',
            numero: '123',
            bairro: 'Vila Madalena',
            cidade: 'São Paulo',
            uf: 'SP',
            cep: '05435000'
        };
    }

    populateUserData() {
        if (!this.userData) return;

     
        document.getElementById('profile-img').src = this.userData.imagem || '/imagens/icone sem cadastro.png';
        document.getElementById('profile-name').textContent = this.userData.nome || 'Maria Silva';
        document.getElementById('profile-email').textContent = this.userData.email || 'maria.silva@email.com';

  
        const headerImg = document.querySelector('.maria');
        if (headerImg) {
            headerImg.src = this.userData.imagem || '/imagens/icone sem cadastro.png';
        }


        document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = this.userData.compras || '12';
        document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = this.favoritesList.length || '0';
        document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = this.userData.avaliacoes || '3';

     
        const firstName = this.userData.nome ? this.userData.nome.split(' ')[0] : 'Maria';
        const lastName = this.userData.nome ? this.userData.nome.split(' ').slice(1).join(' ') : 'Silva';
        
        document.getElementById('first-name').value = firstName;
        document.getElementById('last-name').value = lastName;
        document.getElementById('email').value = this.userData.email || 'maria.silva@email.com';
        document.getElementById('phone').value = this.userData.telefone || '(11) 99999-9999';
        document.getElementById('birth-date').value = this.userData.data_nasc || '';
        document.getElementById('bio').value = this.userData.bio || 'Apaixonada por moda sustentável e peças únicas!';

        
        this.populateAddressInfo();
        this.populateFavorites();
    }

    populateAddressInfo() {
        const addressInfo = document.querySelector('.address-item .address-info');
        if (addressInfo && this.userData) {
            const street = this.userData.logradouro || 'Rua das Flores';
            const number = this.userData.numero || '123';
            const neighborhood = this.userData.bairro || 'Vila Madalena';
            const city = this.userData.cidade || 'São Paulo';
            const state = this.userData.uf || 'SP';
            const cep = this.userData.cep ? this.userData.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '05435-000';

            addressInfo.innerHTML = `
                <h3>Casa</h3>
                <p>${street}, ${number}</p>
                <p>${neighborhood} - ${city}, ${state}</p>
                <p>CEP: ${cep}</p>
            `;
        }

        // Populate address modal form
        if (this.userData) {
            document.getElementById('address-cep').value = this.userData.cep ? this.userData.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
            document.getElementById('address-number').value = this.userData.numero || '';
            document.getElementById('address-street').value = this.userData.logradouro || '';
            document.getElementById('address-neighborhood').value = this.userData.bairro || '';
            document.getElementById('address-city').value = this.userData.cidade || '';
            
            const stateSelect = document.getElementById('address-state');
            if (stateSelect && this.userData.uf) {
                stateSelect.value = this.userData.uf;
            }
        }
    }

    populateFavorites() {
        const favoritesGrid = document.querySelector('.favorites-grid');
        const emptyState = document.querySelector('#favorites .empty-state');
        
        if (this.favoritesList && this.favoritesList.length > 0) {
            if (emptyState) emptyState.style.display = 'none';
            if (favoritesGrid) {
                favoritesGrid.style.display = 'grid';
                favoritesGrid.innerHTML = this.favoritesList.map(favorito => `
                    <section class="favorite-item">
                        <section class="favorite-image">
                            <img src="${favorito.IMG_PRODUTO_1 || '/imagens/produto-default.png'}" alt="${favorito.NOME_PRODUTO}">
                            <button class="remove-favorite" onclick="window.perfilCliente.removeFavorite(${favorito.ID_PRODUTO})" title="Remover dos favoritos">❤️</button>
                        </section>
                        <section class="favorite-info">
                            <h3>${favorito.NOME_PRODUTO}</h3>
                            <p class="favorite-price">R$ ${parseFloat(favorito.PRECO_PRODUTO).toFixed(2).replace('.', ',')}</p>
                            <button class="add-to-cart-btn" onclick="window.perfilCliente.addToCart(${favorito.ID_PRODUTO})">Adicionar ao Carrinho</button>
                        </section>
                    </section>
                `).join('');
            }
        } else {
            if (favoritesGrid) favoritesGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Profile photo upload
        const photoInput = document.getElementById('profile-photo-input');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.uploadProfilePhoto(e.target));
        }
    }

    async uploadProfilePhoto(input) {
        if (input.files && input.files[0]) {
            const formData = new FormData();
            formData.append('profile-photo', input.files[0]);
            
            try {
                const response = await fetch('/perfilcliente/foto', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    document.getElementById('profile-img').src = '/' + data.imagePath;
                    const headerImg = document.querySelector('.maria');
                    if (headerImg) headerImg.src = '/' + data.imagePath;
                }
            } catch (error) {
                console.error('Erro ao fazer upload:', error);
            }
        }
    }

    async removeFavorite(produtoId) {
        try {
            const response = await fetch('/favoritar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produto_id: produtoId })
            });
            
            const data = await response.json();
            if (data.success) {
                await this.loadFavorites();
                this.populateFavorites();
                document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = this.favoritesList.length;
            }
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
        }
    }

    async addToCart(produtoId) {
        try {
            const response = await fetch('/adicionar-sacola', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produto_id: produtoId })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Produto adicionado à sacola!');
            } else {
                alert('Erro ao adicionar produto à sacola');
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            alert('Erro ao adicionar produto à sacola');
        }
    }

    showSection(sectionId) {
        document.getElementById(sectionId).style.display = 'block';
    }

    hideAllSections() {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    addNewAddress() {
        document.getElementById('address-modal').style.display = 'block';
    }

    closeAddressModal() {
        document.getElementById('address-modal').style.display = 'none';
    }

    addNewPayment() {
        alert('Funcionalidade de adicionar cartão em desenvolvimento');
    }
}

// Global functions for onclick handlers
function editProfilePhoto() {
    document.getElementById('profile-photo-input').click();
}

function showSection(sectionId) {
    window.perfilCliente.showSection(sectionId);
}

function hideAllSections() {
    window.perfilCliente.hideAllSections();
}

function addNewAddress() {
    window.perfilCliente.addNewAddress();
}

function closeAddressModal() {
    window.perfilCliente.closeAddressModal();
}

function addNewPayment() {
    window.perfilCliente.addNewPayment();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.perfilCliente = new PerfilCliente();
});
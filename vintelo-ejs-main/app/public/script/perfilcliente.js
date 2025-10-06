function showSection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).style.display = 'block';
}

function hideAllSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

function editProfilePhoto() {
    document.getElementById('profile-photo-input').click();
}

function handleProfilePhotoUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-img').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updatePersonalInfo(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    
    document.getElementById('profile-name').textContent = `${firstName} ${lastName}`;
    document.getElementById('profile-email').textContent = formData.get('email');
    
    alert('Informações atualizadas com sucesso!');
    hideAllSections();
}

function toggleOrderDetails(button) {
    const orderCard = button.closest('.order-card');
    const details = orderCard.querySelector('.order-details');
    
    if (details.style.display === 'none' || !details.style.display) {
        details.style.display = 'block';
        button.textContent = 'Ocultar Detalhes';
    } else {
        details.style.display = 'none';
        button.textContent = 'Ver Detalhes';
    }
}

function toggleTracking(button) {
    const orderCard = button.closest('.order-card');
    const tracking = orderCard.querySelector('.tracking-details');
    
    if (tracking.style.display === 'none' || !tracking.style.display) {
        tracking.style.display = 'block';
        button.textContent = 'Ocultar Rastreamento';
    } else {
        tracking.style.display = 'none';
        button.textContent = 'Ver Rastreamento';
    }
}

function removeFavorite(id) {
    if (confirm('Deseja remover este item dos favoritos?')) {
        const favoriteItem = event.target.closest('.favorite-item');
        favoriteItem.remove();
    }
}

function addNewAddress() {
    document.getElementById('modal-title').textContent = 'Adicionar Novo Endereço';
    document.getElementById('address-modal').style.display = 'flex';
}

function editAddress(id) {
    document.getElementById('modal-title').textContent = 'Editar Endereço';
    document.getElementById('address-modal').style.display = 'flex';
}

function deleteAddress(id) {
    if (confirm('Deseja excluir este endereço?')) {
        event.target.closest('.address-item').remove();
    }
}

function closeAddressModal() {
    document.getElementById('address-modal').style.display = 'none';
    document.querySelector('.address-form').reset();
}

function saveAddress(event) {
    event.preventDefault();
    alert('Endereço salvo com sucesso!');
    closeAddressModal();
}

function addNewPayment() {
    alert('Funcionalidade de adicionar cartão em desenvolvimento');
}

function editPayment(id) {
    alert('Funcionalidade de editar cartão em desenvolvimento');
}

function deletePayment(id) {
    if (confirm('Deseja remover este cartão?')) {
        event.target.closest('.payment-item').remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const cepInput = document.getElementById('address-cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('address-street').value = data.logradouro;
                            document.getElementById('address-neighborhood').value = data.bairro;
                            document.getElementById('address-city').value = data.localidade;
                            document.getElementById('address-state').value = data.uf;
                        }
                    })
                    .catch(error => console.error('Erro ao buscar CEP:', error));
            }
        });
    }
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('address-modal');
    if (event.target === modal) {
        closeAddressModal();
    }
});
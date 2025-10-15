document.addEventListener('DOMContentLoaded', function() {
    const menuLinks = document.querySelectorAll('.profile-menu a');
    const formSections = document.querySelectorAll('.form-section');

    function showSection(sectionId) {
 
        formSections.forEach(section => {
            section.classList.remove('active');
        });
        
        menuLinks.forEach(link => {
            link.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    menuLinks.forEach((link, index) => {
        const sections = ['dados-pessoais', 'endereco', 'seguranca', 'preferencias', 'notificacoes'];
        link.setAttribute('data-section', sections[index]);
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    showSection('dados-pessoais');
});

document.getElementById('cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

document.getElementById('telefone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
});

document.getElementById('cep').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
});

document.getElementById('cep').addEventListener('blur', function() {
    const cep = this.value.replace(/\D/g, '');
    
    if (cep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    document.getElementById('logradouro').value = data.logradouro || '';
                    document.getElementById('bairro').value = data.bairro || '';
                    document.getElementById('cidade').value = data.localidade || '';
                    
                    // Selecionar estado
                    const estadoSelect = document.getElementById('estado');
                    if (data.uf) {
                        estadoSelect.value = data.uf;
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
            });
    }
});

function validatePasswords() {
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    
    if (novaSenha && confirmarSenha) {
        if (novaSenha !== confirmarSenha) {
            document.getElementById('confirmar-senha').setCustomValidity('As senhas não coincidem');
            return false;
        } else {
            document.getElementById('confirmar-senha').setCustomValidity('');
            return true;
        }
    }
    return true;
}

document.getElementById('nova-senha').addEventListener('input', validatePasswords);
document.getElementById('confirmar-senha').addEventListener('input', validatePasswords);

document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validatePasswords()) {
        alert('As senhas não coincidem!');
        return;
    }
    
    const cnpj = document.getElementById('cnpj').value;
    const razaoSocial = document.getElementById('razao_social').value;
    const nomeFantasia = document.getElementById('nome_fantasia').value;
    
    // Validar CNPJ
    if (cnpj && !validarCNPJ(cnpj)) {
        alert('CNPJ inválido!');
        return;
    }
    
    // Validar Razão Social (mínimo 5 caracteres)
    if (razaoSocial && razaoSocial.length < 5) {
        alert('Razão Social deve ter pelo menos 5 caracteres!');
        return;
    }
    
    // Validar Nome Fantasia (mínimo 2 caracteres)
    if (nomeFantasia && nomeFantasia.length < 2) {
        alert('Nome Fantasia deve ter pelo menos 2 caracteres!');
        return;
    }
    
    // Validar CEP
    const cep = document.getElementById('cep').value;
    if (cep && !/^\d{5}-?\d{3}$/.test(cep)) {
        alert('CEP inválido!');
        return;
    }

    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        showNotification('Informações salvas com sucesso!', 'success');
    }, 2000);
});

function resetForm() {
    if (confirm('Tem certeza que deseja cancelar as alterações?')) {
        document.getElementById('profileForm').reset();
        showNotification('Alterações canceladas', 'info');
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Upload de foto
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Upload da foto
        const formData = new FormData();
        formData.append('foto', file);
        
        fetch('/upload-foto-perfil', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Foto enviada com sucesso');
                // Atualizar imagem no header também
                const headerImg = document.querySelector('.maria');
                if (headerImg) {
                    headerImg.src = '/' + data.imagePath;
                }
            } else {
                alert('Erro ao enviar foto: ' + (data.error || 'Erro desconhecido'));
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao enviar foto');
        });
    }
});

// Validação e formatação de CNPJ
document.getElementById('cnpj').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    e.target.value = value;
});

// Validação de CNPJ
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) return false;
    
    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado == digitos.charAt(1);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
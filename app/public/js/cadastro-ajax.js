function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const arrow = document.getElementById(sectionId.replace('-info', '-arrow'));
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        arrow.innerHTML = '▲';
    } else {
        content.style.display = 'none';
        arrow.innerHTML = '▼';
    }
}

function formatCEP(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

function formatCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

function buscarCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('logradouro_usuario').value = data.logradouro || '';
                document.getElementById('bairro_usuario').value = data.bairro || '';
                document.getElementById('cidade_usuario').value = data.localidade || '';
                document.getElementById('uf_usuario').value = data.uf || '';
            }
        })
        .catch(error => {
            console.log('Erro ao buscar CEP:', error);
        });
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('basic-info').style.display = 'block';
    document.getElementById('security-info').style.display = 'block';
    document.getElementById('address-info').style.display = 'block';
    document.getElementById('basic-arrow').innerHTML = '▲';
    document.getElementById('security-arrow').innerHTML = '▲';
    document.getElementById('address-arrow').innerHTML = '▲';
    
    const cepInput = document.getElementById('cep_usuario');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            this.value = formatCEP(this.value);
        });
        
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarCEP(cep);
            }
        });
    }
    
    const cpfInput = document.getElementById('cpf_cliente');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            this.value = formatCPF(this.value);
        });
    }
    
    const telefoneInput = document.getElementById('celular_usuario');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }
    
    // Formulário de cadastro funciona normalmente sem interceptação AJAX
});
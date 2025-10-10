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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('brecho-info').style.display = 'block';
    document.getElementById('security-info').style.display = 'block';
    document.getElementById('address-info').style.display = 'block';
    document.getElementById('brecho-arrow').innerHTML = '▲';
    document.getElementById('security-arrow').innerHTML = '▲';
    document.getElementById('address-arrow').innerHTML = '▲';
    
    const cepInput = document.getElementById('cep');
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
    
    const cnpjInput = document.getElementById('cnpj_brecho');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function() {
            this.value = formatCNPJ(this.value);
        });
    }
    
    const telefoneInput = document.getElementById('fone_usu');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }
    
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const senha = document.getElementById('senha_usu').value;
            const confirmarSenha = document.getElementById('confirmar_senha').value;
            
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                e.preventDefault();
                return false;
            }
            
            if (senha.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres!');
                e.preventDefault();
                return false;
            }
        });
    }
});

function formatCEP(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

function formatCNPJ(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

function buscarCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('endereco').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('uf').value = data.uf || '';
            }
        })
        .catch(error => {
            console.log('Erro ao buscar CEP:', error);
        });
}
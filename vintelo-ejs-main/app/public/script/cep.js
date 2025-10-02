function buscarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) {
        return;
    }
    

    document.getElementById('endereco').value = 'Buscando...';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('uf').value = '';
    
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('endereco').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('uf').value = data.uf || '';
                document.getElementById('numero').focus();
            } else {
                alert('CEP não encontrado');
                limparCamposEndereco();
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Verifique sua conexão.');
            limparCamposEndereco();
        });
}

function limparCamposEndereco() {
    document.getElementById('endereco').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('uf').value = '';
}

function mascaraCEP(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

function mascaraTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = '(' + value.substring(0, 2) + ') ' + value.substring(2, 7) + '-' + value.substring(7, 11);
    } else if (value.length > 6) {
        value = '(' + value.substring(0, 2) + ') ' + value.substring(2, 6) + '-' + value.substring(6);
    } else if (value.length > 2) {
        value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
    }
    input.value = value;
}

document.addEventListener('DOMContentLoaded', function() {
    
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            mascaraCEP(this);
        });
    }
    
    const telefoneInput = document.getElementById('fone_usu');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            mascaraTelefone(this);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const cepInput = document.getElementById('cep');
   
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
        });
 
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
           
            if (cep.length === 8) {
                buscarCEP(cep);
            }
        });
    }
});
 
function buscarCEP(cep) {
    const endereco = document.getElementById('endereco');
    const bairro = document.getElementById('bairro');
    const cidade = document.getElementById('cidade');
    const uf = document.getElementById('uf');
   
    if (!endereco || !bairro || !cidade || !uf) {
        console.log('Elementos de endereço não encontrados');
        return;
    }
   
    endereco.value = '';
    bairro.value = '';
    cidade.value = '';
    uf.value = '';
   
    endereco.placeholder = 'Buscando...';
   
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                alert('CEP não encontrado!');
                endereco.placeholder = 'Rua, Avenida...';
                return;
            }
           
            endereco.value = data.logradouro || '';
            bairro.value = data.bairro || '';
            cidade.value = data.localidade || '';
            uf.value = data.uf || '';
           
            endereco.placeholder = 'Rua, Avenida...';
           
            if (!data.logradouro) {
                endereco.focus();
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Tente novamente.');
            endereco.placeholder = 'Rua, Avenida...';
        });
}
 
function validarCEP(cep) {
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep);
}
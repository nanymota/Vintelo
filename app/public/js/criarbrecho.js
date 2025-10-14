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
 
function showSuccessNotify(title, message) {
    if (typeof Notify !== 'undefined') {
        new Notify({
            status: 'success',
            title: title,
            text: message,
            effect: 'slide',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 3000,
            position: 'right top'
        });
    } else {
        console.log(`SUCCESS: ${title} - ${message}`);
    }
}
 
function showErrorNotify(title, message) {
    if (typeof Notify !== 'undefined') {
        new Notify({
            status: 'error',
            title: title,
            text: message,
            effect: 'slide',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 5000,
            position: 'right top'
        });
    } else {
        console.log(`ERROR: ${title} - ${message}`);
        alert(`${title}: ${message}`);
    }
}
 
function showWarningNotify(title, message) {
    if (typeof Notify !== 'undefined') {
        new Notify({
            status: 'warning',
            title: title,
            text: message,
            effect: 'slide',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 4000,
            position: 'right top'
        });
    } else {
        console.log(`WARNING: ${title} - ${message}`);
    }
}
 
function goBack() {
    window.history.back();
}
 
function validarNomeBrecho(input) {
    const valor = input.value.trim();
   
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Nome do brechó é obrigatório!');
        return false;
    }
   
    if (valor.length < 3 || valor.length > 45) {
        showErrorNotify('Nome Inválido', 'Nome do brechó deve ter de 3 a 45 caracteres!');
        return false;
    }
   
    showSuccessNotify('Nome Válido', 'Nome do brechó confirmado!');
    return true;
}
 
function validarCNPJ(input) {
    const valor = input.value.replace(/\D/g, '');
   
    if (valor && valor.length > 0) {
        if (valor.length !== 14) {
            showErrorNotify('CNPJ Inválido', 'CNPJ deve ter 14 dígitos!');
            return false;
        }
        showSuccessNotify('CNPJ Válido', 'CNPJ digitado corretamente!');
    }
    return true;
}
 
function validarEmail(input) {
    const valor = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'E-mail é obrigatório!');
        return false;
    }
   
    if (!emailRegex.test(valor)) {
        showErrorNotify('E-mail Inválido', 'Digite um e-mail válido!');
        return false;
    }
   
    showSuccessNotify('E-mail Válido', 'E-mail digitado corretamente!');
    return true;
}
 
function validarTelefone(input) {
    const valor = input.value.replace(/\D/g, '');
   
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Telefone é obrigatório!');
        return false;
    }
   
    if (valor.length < 10 || valor.length > 11) {
        showErrorNotify('Telefone Inválido', 'Telefone deve ter 10 ou 11 dígitos!');
        return false;
    }
   
    showSuccessNotify('Telefone Válido', 'Telefone digitado corretamente!');
    return true;
}
 
function validarSenha(input) {
    const valor = input.value;
   
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Senha é obrigatória!');
        return false;
    }
   
    if (valor.length < 6) {
        showErrorNotify('Senha Fraca', 'Senha deve ter no mínimo 6 caracteres!');
        return false;
    }
   
    showSuccessNotify('Senha Válida', 'Senha criada com sucesso!');
    return true;
}
 
function validarConfirmarSenha(input) {
    const senha = document.getElementById('senha_usu').value;
    const confirmarSenha = input.value;
   
    if (!confirmarSenha) {
        showErrorNotify('Campo Obrigatório', 'Confirmação de senha é obrigatória!');
        return false;
    }
   
    if (senha !== confirmarSenha) {
        showErrorNotify('Senhas Diferentes', 'As senhas não coincidem!');
        return false;
    }
   
    showSuccessNotify('Senhas Conferem', 'Confirmação de senha correta!');
    return true;
}
 
function validarCEP(input) {
    const valor = input.value.replace(/\D/g, '');
   
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'CEP é obrigatório!');
        return false;
    }
   
    if (valor.length !== 8) {
        showErrorNotify('CEP Inválido', 'CEP deve ter 8 dígitos!');
        return false;
    }
   
    return true;
}
 
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('brecho-info').style.display = 'block';
    document.getElementById('security-info').style.display = 'block';
    document.getElementById('address-info').style.display = 'block';
    document.getElementById('brecho-arrow').innerHTML = '▲';
    document.getElementById('security-arrow').innerHTML = '▲';
    document.getElementById('address-arrow').innerHTML = '▲';
   
 
   
    const nomeBrechoInput = document.getElementById('nomeusu_usu');
    if (nomeBrechoInput) {
        nomeBrechoInput.addEventListener('blur', function() {
            validarNomeBrecho(this);
        });
    }
   
    const nomeCompletoInput = document.getElementById('nome_usu');
    if (nomeCompletoInput) {
        nomeCompletoInput.addEventListener('blur', function() {
            const valor = this.value.trim();
            if (!valor) {
                showErrorNotify('Campo Obrigatório', 'Nome completo é obrigatório!');
            } else if (valor.length < 3 || valor.length > 100) {
                showErrorNotify('Nome Inválido', 'Nome deve ter de 3 a 100 caracteres!');
            } else {
                showSuccessNotify('Nome Válido', 'Nome completo confirmado!');
            }
        });
    }
   
    const emailInput = document.getElementById('email_usu');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validarEmail(this);
        });
    }
 
    const telefoneInput = document.getElementById('fone_usu');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
       
        telefoneInput.addEventListener('blur', function() {
            validarTelefone(this);
        });
    }
 
    const senhaInput = document.getElementById('senha_usu');
    if (senhaInput) {
        senhaInput.addEventListener('blur', function() {
            validarSenha(this);
        });
    }
   
    const confirmarSenhaInput = document.getElementById('confirmar_senha');
    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('blur', function() {
            validarConfirmarSenha(this);
        });
    }
   
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            this.value = formatCEP(this.value);
        });
       
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (validarCEP(this) && cep.length === 8) {
                buscarCEP(cep);
            }
        });
    }
 
    const cnpjInput = document.getElementById('cnpj_brecho');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function() {
            this.value = formatCNPJ(this.value);
        });
       
        cnpjInput.addEventListener('blur', function() {
            validarCNPJ(this);
        });
    }
   
    const camposEndereco = ['endereco', 'numero', 'bairro', 'cidade', 'uf'];
    camposEndereco.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('blur', function() {
                const valor = this.value.trim();
                if (!valor) {
                    showErrorNotify('Campo Obrigatório', `${this.previousElementSibling.textContent} é obrigatório!`);
                } else {
                    showSuccessNotify('Campo Válido', `${this.previousElementSibling.textContent} confirmado!`);
                }
            });
        }
    });
   
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const senha = document.getElementById('senha_usu').value;
            const confirmarSenha = document.getElementById('confirmar_senha').value;
           
            if (senha !== confirmarSenha) {
                showErrorNotify('Erro de Validação', 'As senhas não coincidem!');
                e.preventDefault();
                return false;
            }
           
            if (senha.length < 6) {
                showErrorNotify('Erro de Validação', 'A senha deve ter pelo menos 6 caracteres!');
                e.preventDefault();
                return false;
            }
           
            // Validar campos obrigatórios
            const camposObrigatorios = [
                { id: 'nomeusu_usu', nome: 'Nome do Brechó' },
                { id: 'nome_usu', nome: 'Nome Completo' },
                { id: 'email_usu', nome: 'E-mail' },
                { id: 'fone_usu', nome: 'Telefone' },
                { id: 'cep', nome: 'CEP' },
                { id: 'endereco', nome: 'Endereço' },
                { id: 'numero', nome: 'Número' },
                { id: 'bairro', nome: 'Bairro' },
                { id: 'cidade', nome: 'Cidade' },
                { id: 'uf', nome: 'UF' }
            ];
           
            for (let campo of camposObrigatorios) {
                const input = document.getElementById(campo.id);
                if (!input || !input.value.trim()) {
                    showErrorNotify('Campo Obrigatório', `${campo.nome} é obrigatório!`);
                    e.preventDefault();
                    return false;
                }
            }
           
            showSuccessNotify('Formulário Válido', 'Criando seu brechó...');
           
            // Desabilitar o botão de submit para evitar duplo clique
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Criando...';
            }
           
            // Permitir que o formulário seja enviado normalmente
            return true;
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
               
                showSuccessNotify('CEP Encontrado', 'Endereço preenchido automaticamente!');
            } else {
                showErrorNotify('CEP Inválido', 'CEP não encontrado. Verifique o número digitado.');
            }
        })
        .catch(error => {
            console.log('Erro ao buscar CEP:', error);
            showErrorNotify('Erro de Conexão', 'Não foi possível buscar o CEP. Tente novamente.');
        });
}
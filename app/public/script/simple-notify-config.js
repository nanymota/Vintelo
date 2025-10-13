// ========== FUNÇÕES DE FORMATAÇÃO ==========
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

function formatarNomeInteligente(nome) {
    const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e'];
    const palavras = nome.toLowerCase().split(' ');
    
    const palavrasFormatadas = palavras.map((palavra, index) => {
        palavra = palavra.trim();
        if (palavra.length === 0) return '';
        
        if (index === 0 || index === palavras.length - 1) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        }
        
        if (preposicoes.includes(palavra)) {
            return palavra;
        }
        
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    });
    
    return palavrasFormatadas.join(' ');
}

// ========== FUNÇÕES DE VALIDAÇÃO ==========
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    // Primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpf.charAt(9)) !== digito1) return false;
    
    // Segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cpf.charAt(10)) === digito2;
}

function validarCPFCampo(input) {
    const cpf = input.value.replace(/\D/g, '');
    
    if (cpf.length === 11) {
        if (!validarCPF(cpf)) {
            showErrorNotify('CPF Inválido', 'Por favor, digite um CPF válido.');
            return false;
        } else {
            showSuccessNotify('CPF Válido', 'CPF digitado corretamente.');
            return true;
        }
    }
    return null;
}

function validarNomeCompleto(input) {
    const valor = input.value.trim();
    
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Nome completo é obrigatório!');
        return false;
    }
    
    if (valor.length < 3 || valor.length > 70) {
        showErrorNotify('Nome Inválido', 'Nome deve ter de 3 a 70 caracteres!');
        return false;
    }
    
    const palavras = valor.split(' ').filter(p => p.length > 0);
    if (palavras.length < 2) {
        showErrorNotify('Nome Incompleto', 'Digite seu nome completo (nome e sobrenome)!');
        return false;
    }
    
    showSuccessNotify('Nome Válido', 'Nome completo confirmado!');
    return true;
}

function validarNomeUsuario(input) {
    const valor = input.value.trim();
    
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Nome de usuário é obrigatório!');
        return false;
    }
    
    if (valor.length < 3 || valor.length > 50) {
        showErrorNotify('Nome de Usuário Inválido', 'Nome de usuário deve ter de 3 a 50 caracteres!');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(valor)) {
        showErrorNotify('Caracteres Inválidos', 'Use apenas letras, números e underscore (_)!');
        return false;
    }
    
    showSuccessNotify('Nome de Usuário Válido', 'Nome de usuário disponível!');
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

function validarSenha(input) {
    const valor = input.value;
    
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Senha é obrigatória!');
        return false;
    }
    
    if (valor.length < 8) {
        showErrorNotify('Senha Fraca', 'Senha deve ter no mínimo 8 caracteres!');
        return false;
    }
    
    const temMaiuscula = /[A-Z]/.test(valor);
    const temMinuscula = /[a-z]/.test(valor);
    const temNumero = /[0-9]/.test(valor);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(valor);
    
    if (!temMaiuscula || !temMinuscula || !temNumero || !temEspecial) {
        showWarningNotify('Senha Média', 'Use maiúscula, minúscula, número e caractere especial!');
        return true;
    }
    
    showSuccessNotify('Senha Forte', 'Senha segura criada!');
    return true;
}

function mostrarForcaSenha(input) {
    const valor = input.value;
    let forca = 0;
    
    if (valor.length >= 8) forca++;
    if (/[A-Z]/.test(valor)) forca++;
    if (/[a-z]/.test(valor)) forca++;
    if (/[0-9]/.test(valor)) forca++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(valor)) forca++;
    
    if (valor.length > 0 && forca < 3) {
        showWarningNotify('Senha Fraca', 'Adicione mais caracteres para aumentar a segurança!');
    }
}

function validarDataNascimento(input) {
    const valor = input.value;
    
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Data de nascimento é obrigatória!');
        return false;
    }
    
    const hoje = new Date();
    const nascimento = new Date(valor);
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    
    if (nascimento > hoje) {
        showErrorNotify('Data Inválida', 'Data de nascimento não pode ser no futuro!');
        return false;
    }
    
    if (idade < 13) {
        showErrorNotify('Idade Mínima', 'Você deve ter pelo menos 13 anos para se cadastrar!');
        return false;
    }
    
    if (idade > 120) {
        showErrorNotify('Data Inválida', 'Verifique a data de nascimento digitada!');
        return false;
    }
    
    showSuccessNotify('Data Válida', 'Data de nascimento confirmada!');
    return true;
}

function validarTelefone(input) {
    const valor = input.value.replace(/\D/g, '');
    
    if (!valor) {
        showErrorNotify('Campo Obrigatório', 'Telefone é obrigatório!');
        return false;
    }
    
    if (valor.length !== 11) {
        showErrorNotify('Telefone Inválido', 'Telefone deve ter 11 dígitos (DDD + número)!');
        return false;
    }
    
    if (!valor.startsWith('11')) {
        showWarningNotify('DDD Diferente', 'Verifique se o DDD está correto!');
    }
    
    showSuccessNotify('Telefone Válido', 'Telefone digitado corretamente!');
    return true;
}

// ========== FUNÇÕES DE API ==========
function buscarCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('logradouro_usuario').value = data.logradouro || '';
                document.getElementById('bairro_usuario').value = data.bairro || '';
                document.getElementById('cidade_usuario').value = data.localidade || '';
                document.getElementById('uf_usuario').value = data.uf || '';
                
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

// ========== FUNÇÕES DE NOTIFICAÇÃO ==========
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
    }
}
// Teste para verificar se o sistema de upload está funcionando
const fs = require('fs');
const path = require('path');

console.log('=== TESTE DO SISTEMA DE UPLOAD ===');

// Verificar se os diretórios existem
const directories = [
    './app/public/imagem',
    './app/public/imagem/perfil',
    './app/public/imagem/produtos',
    './app/public/imagem/banners'
];

directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ Diretório existe: ${dir}`);
        
        // Verificar permissões
        try {
            fs.accessSync(dir, fs.constants.W_OK);
            console.log(`✅ Permissão de escrita: ${dir}`);
        } catch (error) {
            console.log(`❌ Sem permissão de escrita: ${dir}`);
        }
    } else {
        console.log(`❌ Diretório não existe: ${dir}`);
        
        // Tentar criar
        try {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Diretório criado: ${dir}`);
        } catch (error) {
            console.log(`❌ Erro ao criar diretório: ${dir} - ${error.message}`);
        }
    }
});

// Verificar se o uploader.js existe e está correto
const uploaderPath = './app/util/uploader.js';
if (fs.existsSync(uploaderPath)) {
    console.log('✅ Arquivo uploader.js existe');
    
    try {
        const uploader = require(uploaderPath);
        console.log('✅ Uploader carregado com sucesso');
        console.log('Tipo do uploader:', typeof uploader);
    } catch (error) {
        console.log('❌ Erro ao carregar uploader:', error.message);
    }
} else {
    console.log('❌ Arquivo uploader.js não encontrado');
}

// Verificar se multer está instalado
try {
    const multer = require('multer');
    console.log('✅ Multer está disponível');
} catch (error) {
    console.log('❌ Multer não está instalado:', error.message);
}

console.log('=== FIM DO TESTE ===');
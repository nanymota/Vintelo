const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório com caminho absoluto
const uploadDir = path.join(__dirname, '../public/imagem/produtos/');
console.log('Caminho do diretório de upload:', uploadDir);

// Garantir que o diretório existe
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Diretório criado com sucesso:', uploadDir);
    } catch (error) {
        console.error('Erro ao criar diretório:', error);
    }
} else {
    console.log('Diretório já existe:', uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Salvando arquivo em:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'produto-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = upload;
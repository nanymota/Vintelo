// Correção para o problema de upload de foto
// Adicione este código ao router.js para substituir a rota existente

// Configuração melhorada do multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório existe
const uploadDir = './app/public/imagem/perfil/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuração do multer com validações
const uploadFoto = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        console.log('Validando arquivo:', file);
        
        // Verificar tipo de arquivo
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas'));
        }
        
        // Verificar extensões permitidas
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            return cb(new Error('Extensão de arquivo não permitida'));
        }
        
        cb(null, true);
    }
});

// ROTA CORRIGIDA - Substitua a rota existente por esta:
router.post('/upload-foto-perfil', 
    verificarUsuAutenticado, // Usar middleware em vez de verificação manual
    uploadFoto.single('foto'), 
    async function(req, res) {
        try {
            console.log('=== UPLOAD FOTO PERFIL CORRIGIDO ===');
            console.log('Usuário autenticado:', req.session.autenticado);
            console.log('Arquivo recebido:', req.file);
            
            // Verificar se o arquivo foi enviado
            if (!req.file) {
                console.log('Nenhum arquivo enviado');
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nenhum arquivo enviado' 
                });
            }
            
            const userId = req.session.autenticado.id;
            const imagePath = 'imagem/perfil/' + req.file.filename;
            
            console.log('Atualizando usuário ID:', userId, 'com imagem:', imagePath);
            
            // Atualizar no banco de dados
            const [result] = await pool.query(
                'UPDATE USUARIOS SET IMG_URL = ? WHERE ID_USUARIO = ?', 
                [imagePath, userId]
            );
            
            console.log('Resultado da atualização:', result);
            
            if (result.affectedRows > 0) {
                // Atualizar sessão
                req.session.autenticado.imagem = imagePath;
                
                console.log('Upload realizado com sucesso!');
                res.json({ 
                    success: true, 
                    imagePath: imagePath,
                    message: 'Foto atualizada com sucesso!'
                });
            } else {
                // Remover arquivo se não conseguiu atualizar no banco
                fs.unlinkSync(req.file.path);
                
                res.status(500).json({ 
                    success: false, 
                    error: 'Falha ao atualizar no banco de dados' 
                });
            }
            
        } catch (error) {
            console.log('ERRO no upload:', error);
            
            // Remover arquivo em caso de erro
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Tratar erros específicos do multer
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Arquivo muito grande. Máximo 5MB.' 
                    });
                }
            }
            
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Erro interno do servidor' 
            });
        }
    }
);

// ROTA DE TESTE ADICIONAL
router.get('/test-upload-page', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-upload-debug.html'));
});

console.log('Correção de upload carregada!');
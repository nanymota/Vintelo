const fs = require('fs');
const path = require('path');

const pagesDir = 'c:\\Users\\Hp\\OneDrive - Fundação Instituto de Educação de Barueri\\Área de Trabalho\\FIEB\\vintelo-ejs-main\\app\\views\\pages';

// Páginas que têm botões de favorito
const pagesWithFavorites = [
    'buscar.ejs', 'categorias.ejs', 'favoritos.ejs', 'finalizandocompra.ejs',
    'homecomprador.ejs', 'homevendedor.ejs', 'perfilbrecho.ejs', 
    'produto2.ejs', 'sacola1.ejs'
];

function addFavoritesScript(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se já tem o script
    if (content.includes('favoritos-global.js')) {
        return;
    }
    
    // Adiciona o script antes do </body>
    const scriptTag = '    <script src="/js/favoritos-global.js"></script>';
    
    if (content.includes('</body>')) {
        content = content.replace('</body>', scriptTag + '\n</body>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Adicionado script em: ${path.basename(filePath)}`);
    }
}

// Processa as páginas
pagesWithFavorites.forEach(fileName => {
    const filePath = path.join(pagesDir, fileName);
    if (fs.existsSync(filePath)) {
        try {
            addFavoritesScript(filePath);
        } catch (error) {
            console.error(`Erro ao processar ${fileName}:`, error.message);
        }
    }
});

console.log('Scripts de favoritos adicionados!');
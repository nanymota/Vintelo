const fs = require('fs');
const path = require('path');

const pagesDir = 'c:\\Users\\Hp\\OneDrive - Fundação Instituto de Educação de Barueri\\Área de Trabalho\\FIEB\\vintelo-ejs-main\\app\\views\\pages';

// Páginas que têm botões de sacola
const pagesWithCart = [
    'buscar.ejs', 'categorias.ejs', 'favoritos.ejs', 'finalizandocompra.ejs',
    'homecomprador.ejs', 'homevendedor.ejs', 'perfilbrecho.ejs', 
    'produto1.ejs', 'produto2.ejs', 'produto3.ejs', 'produto4.ejs',
    'perfil1.ejs', 'perfil2.ejs', 'perfil3.ejs', 'index.ejs', 'homeadm.ejs'
];

function addCartScript(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Verifica se já tem o script
    if (content.includes('sacola-global.js')) {
        return;
    }
    
    // Adiciona onclick aos botões sem função
    content = content.replace(/<button class="cart"><img/g, '<button class="cart" onclick="addToCart(1)"><img');
    
    // Adiciona o script antes do </body>
    const scriptTag = '    <script src="/js/sacola-global.js"></script>';
    
    if (content.includes('</body>')) {
        content = content.replace('</body>', scriptTag + '\n</body>');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Adicionado script em: ${path.basename(filePath)}`);
    }
}

// Processa as páginas
pagesWithCart.forEach(fileName => {
    const filePath = path.join(pagesDir, fileName);
    if (fs.existsSync(filePath)) {
        try {
            addCartScript(filePath);
        } catch (error) {
            console.error(`Erro ao processar ${fileName}:`, error.message);
        }
    }
});

console.log('Scripts de sacola adicionados!');
const fs = require('fs');
const path = require('path');

const pagesDir = 'c:\\Users\\Hp\\OneDrive - Fundação Instituto de Educação de Barueri\\Área de Trabalho\\FIEB\\vintelo-ejs-main\\app\\views\\pages';

// Função para corrigir uma página
function fixPage(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Adicionar função goBack() se não existir
    if (!content.includes('function goBack()') && content.includes('onclick="goBack()"')) {
        const scriptTag = `    <script>
        function goBack() {
            window.history.back();
        }
    </script>`;
        
        if (content.includes('</body>')) {
            content = content.replace('</body>', scriptTag + '\n</body>');
            changed = true;
        }
    }

    // 2. Corrigir imagens de perfil sem classe maria ou border-radius
    const profileImgPatterns = [
        // Padrão sem classe maria
        /<img src="<%= autenticado && autenticado\.imagem \? autenticado\.imagem : '[^']*' %>"([^>]*?)>/g,
        /<img src="<%= \(typeof usuario[^>]*?\) \? [^>]*? : '[^']*' %>"([^>]*?)>/g,
        /<img src="<%= autenticado && autenticado\.imagem \? '\/?' \+ autenticado\.imagem : '[^']*' %>"([^>]*?)>/g
    ];

    profileImgPatterns.forEach(pattern => {
        content = content.replace(pattern, (match, attributes) => {
            if (!attributes.includes('class="maria"') && !attributes.includes('border-radius: 50%')) {
                if (attributes.includes('class="')) {
                    // Adicionar maria à classe existente
                    attributes = attributes.replace(/class="([^"]*)"/, 'class="$1 maria"');
                } else {
                    // Adicionar classe maria
                    attributes += ' class="maria"';
                }
                changed = true;
            }
            return match.replace(/(<img[^>]*?)>/, `$1${attributes}>`);
        });
    });

    // 3. Corrigir links da seta que não direcionam corretamente
    const wrongBackLinks = [
        'href="javascript:void(0)" onclick="goBack()"',
        'href="/perfilvender"',
        'href="/perfilcliente"'
    ];

    wrongBackLinks.forEach(wrongLink => {
        if (content.includes(wrongLink) && content.includes('seta.png')) {
            // Verificar se é realmente um botão de voltar pela presença da seta
            const context = content.substring(content.indexOf(wrongLink) - 100, content.indexOf(wrongLink) + 200);
            if (context.includes('seta.png')) {
                content = content.replace(wrongLink, 'href="javascript:void(0)" onclick="goBack()"');
                changed = true;
            }
        }
    });

    // Salvar se houve mudanças
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Corrigido: ${path.basename(filePath)}`);
    }
}

// Processar todas as páginas
const files = fs.readdirSync(pagesDir);
files.forEach(file => {
    if (file.endsWith('.ejs')) {
        const filePath = path.join(pagesDir, file);
        try {
            fixPage(filePath);
        } catch (error) {
            console.error(`Erro ao processar ${file}:`, error.message);
        }
    }
});

console.log('Correção concluída!');
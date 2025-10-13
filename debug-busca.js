// Script para testar e debugar a funcionalidade de busca
const pool = require('./app/config/pool_conexoes');

async function debugBusca() {
    try {
        console.log('=== DEBUG BUSCA ===');
        
        // Verificar total de produtos
        const [totalProdutos] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS');
        console.log('Total de produtos no banco:', totalProdutos[0].total);
        
        // Verificar produtos disponíveis
        const [produtosDisponiveis] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS WHERE STATUS_PRODUTO = "d"');
        console.log('Produtos disponíveis (status "d"):', produtosDisponiveis[0].total);
        
        // Verificar brechós
        const [totalBrechos] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS WHERE TIPO_USUARIO = "b"');
        console.log('Total de brechós:', totalBrechos[0].total);
        
        // Listar alguns produtos para teste
        const [produtos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.TIPO_PRODUTO, p.COR_PRODUTO, p.STATUS_PRODUTO, u.NOME_USUARIO
            FROM PRODUTOS p
            LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            ORDER BY p.ID_PRODUTO DESC
            LIMIT 5
        `);
        console.log('\nÚltimos produtos cadastrados:');
        produtos.forEach(p => {
            console.log(`- ID: ${p.ID_PRODUTO}, Nome: ${p.NOME_PRODUTO}, Tipo: ${p.TIPO_PRODUTO}, Status: ${p.STATUS_PRODUTO}, Vendedor: ${p.NOME_USUARIO}`);
        });
        
        // Listar alguns brechós
        const [brechos] = await pool.query(`
            SELECT ID_USUARIO, NOME_USUARIO, TIPO_USUARIO
            FROM USUARIOS
            WHERE TIPO_USUARIO = 'b'
            LIMIT 5
        `);
        console.log('\nBrechós cadastrados:');
        brechos.forEach(b => {
            console.log(`- ID: ${b.ID_USUARIO}, Nome: ${b.NOME_USUARIO}, Tipo: ${b.TIPO_USUARIO}`);
        });
        
        // Testar busca por termo comum
        const termo = 'vestido';
        console.log(`\n=== TESTE DE BUSCA: "${termo}" ===`);
        
        const [resultadoBusca] = await pool.query(`
            SELECT p.*, u.NOME_USUARIO as VENDEDOR
            FROM PRODUTOS p
            LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            WHERE p.STATUS_PRODUTO = 'd' AND (
                p.NOME_PRODUTO LIKE ? OR 
                p.TIPO_PRODUTO LIKE ? OR 
                p.COR_PRODUTO LIKE ? OR
                p.ESTILO_PRODUTO LIKE ?
            )
            LIMIT 5
        `, [`%${termo}%`, `%${termo}%`, `%${termo}%`, `%${termo}%`]);
        
        console.log(`Produtos encontrados para "${termo}":`, resultadoBusca.length);
        resultadoBusca.forEach(p => {
            console.log(`- ${p.NOME_PRODUTO} (${p.TIPO_PRODUTO}) - ${p.VENDEDOR}`);
        });
        
        // Se não há produtos, criar alguns de teste
        if (totalProdutos[0].total === 0) {
            console.log('\n=== CRIANDO PRODUTOS DE TESTE ===');
            
            // Primeiro criar um usuário brechó se não existir
            const [usuarioBrecho] = await pool.query('SELECT ID_USUARIO FROM USUARIOS WHERE TIPO_USUARIO = "b" LIMIT 1');
            let brechoId;
            
            if (usuarioBrecho.length === 0) {
                const [novoBrecho] = await pool.query(`
                    INSERT INTO USUARIOS (USER_USUARIO, NOME_USUARIO, EMAIL_USUARIO, CELULAR_USUARIO, SENHA_USUARIO, TIPO_USUARIO)
                    VALUES ('brecho_teste', 'Brechó Teste', 'brecho@teste.com', '11999999999', 'senha123', 'b')
                `);
                brechoId = novoBrecho.insertId;
                console.log('Brechó teste criado com ID:', brechoId);
            } else {
                brechoId = usuarioBrecho[0].ID_USUARIO;
                console.log('Usando brechó existente ID:', brechoId);
            }
            
            // Criar produtos de teste
            const produtosTeste = [
                {
                    NOME_PRODUTO: 'Vestido Floral Vintage',
                    PRECO: 89.90,
                    TIPO_PRODUTO: 'vestidos',
                    COR_PRODUTO: 'azul',
                    ESTILO_PRODUTO: 'vintage',
                    CONDICAO_PRODUTO: 'usado',
                    TAMANHO_PRODUTO: 'M',
                    STATUS_PRODUTO: 'd',
                    ID_USUARIO: brechoId
                },
                {
                    NOME_PRODUTO: 'Blusa Branca Casual',
                    PRECO: 45.00,
                    TIPO_PRODUTO: 'blusas',
                    COR_PRODUTO: 'branco',
                    ESTILO_PRODUTO: 'casual',
                    CONDICAO_PRODUTO: 'novo',
                    TAMANHO_PRODUTO: 'P',
                    STATUS_PRODUTO: 'd',
                    ID_USUARIO: brechoId
                },
                {
                    NOME_PRODUTO: 'Saia Jeans Moderna',
                    PRECO: 65.50,
                    TIPO_PRODUTO: 'saias',
                    COR_PRODUTO: 'azul',
                    ESTILO_PRODUTO: 'moderno',
                    CONDICAO_PRODUTO: 'usado',
                    TAMANHO_PRODUTO: 'G',
                    STATUS_PRODUTO: 'd',
                    ID_USUARIO: brechoId
                }
            ];
            
            for (const produto of produtosTeste) {
                const [resultado] = await pool.query('INSERT INTO PRODUTOS SET ?', [produto]);
                console.log(`Produto "${produto.NOME_PRODUTO}" criado com ID:`, resultado.insertId);
            }
            
            console.log('Produtos de teste criados com sucesso!');
        }
        
        console.log('\n=== DEBUG CONCLUÍDO ===');
        
    } catch (error) {
        console.error('Erro no debug:', error);
    } finally {
        process.exit(0);
    }
}

debugBusca();
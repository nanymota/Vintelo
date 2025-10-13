// Script para debugar problemas com edição de produtos
const pool = require('./app/config/pool_conexoes');

async function debugProdutos() {
    try {
        console.log('=== DEBUG PRODUTOS ===');
        
        // 1. Verificar estrutura da tabela PRODUTOS
        console.log('\n1. Estrutura da tabela PRODUTOS:');
        const [estrutura] = await pool.query('DESCRIBE PRODUTOS');
        console.table(estrutura);
        
        // 2. Verificar alguns produtos existentes
        console.log('\n2. Produtos existentes (primeiros 5):');
        const [produtos] = await pool.query('SELECT * FROM PRODUTOS LIMIT 5');
        console.table(produtos);
        
        // 3. Verificar se há produtos com campos NULL problemáticos
        console.log('\n3. Verificando campos NULL:');
        const [nulls] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN NOME_PRODUTO IS NULL THEN 1 ELSE 0 END) as nome_null,
                SUM(CASE WHEN PRECO IS NULL THEN 1 ELSE 0 END) as preco_null,
                SUM(CASE WHEN TIPO_PRODUTO IS NULL THEN 1 ELSE 0 END) as tipo_null
            FROM PRODUTOS
        `);
        console.table(nulls);
        
        // 4. Verificar constraints e índices
        console.log('\n4. Informações da tabela:');
        const [info] = await pool.query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'PRODUTOS' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        console.table(info);
        
        console.log('\n=== FIM DEBUG ===');
        
    } catch (error) {
        console.error('Erro no debug:', error);
    } finally {
        process.exit(0);
    }
}

debugProdutos();
# Correções para Upload de Foto de Perfil

## Problemas Identificados e Soluções

### 1. **Configuração do Multer Simplificada**
- Removido o uso do uploader.js complexo
- Criada configuração direta do multer na rota
- Limite de arquivo reduzido para 5MB para melhor performance

### 2. **Rota de Upload Simplificada**
- Rota: `POST /upload-foto-perfil`
- Verificação manual de autenticação (sem middleware)
- Logs detalhados para debug
- Tratamento de erros melhorado

### 3. **JavaScript Frontend Simplificado**
- Removidas validações complexas
- Foco na funcionalidade básica
- Melhor tratamento de erros

### 4. **HTML Corrigido**
- Botão com `type="button"` para evitar submit
- Accept mais específico para imagens

## Como Testar

### 1. **Teste Básico**
1. Faça login no sistema
2. Vá para `/perfilcliente`
3. Clique no botão "+" na foto do perfil
4. Selecione uma imagem (JPG, PNG)
5. A foto deve ser atualizada automaticamente

### 2. **Debug Avançado**
1. Acesse `/debug-upload` no navegador
2. Clique em "Verificar Sessão" para ver se está logado
3. Use "Testar Upload" para teste sem autenticação
4. Use "Upload Real" para teste com autenticação

### 3. **Verificar Logs**
- Abra o console do servidor
- Os logs mostrarão detalhes do processo de upload
- Verifique se os arquivos estão sendo salvos em `/app/public/imagem/perfil/`

## Arquivos Modificados

1. **`/app/routes/router.js`**
   - Nova configuração do multer
   - Rota de upload simplificada
   - Rotas de debug adicionadas

2. **`/app/public/js/perfil-cliente.js`**
   - Função de upload simplificada
   - Melhor tratamento de erros

3. **`/app/views/pages/perfilcliente.ejs`**
   - HTML do botão corrigido

## Rotas de Debug Criadas

- `GET /debug-session` - Verifica status da sessão
- `GET /debug-upload` - Página de teste completa
- `POST /test-upload-debug` - Upload sem autenticação (apenas teste)

## Próximos Passos

Se ainda não funcionar:

1. Verifique se o usuário está realmente logado
2. Confirme se a pasta `/app/public/imagem/perfil/` existe e tem permissões de escrita
3. Teste com uma imagem pequena (menos de 1MB)
4. Verifique os logs do servidor para erros específicos

## Comandos Úteis

```bash
# Verificar se a pasta existe
ls -la app/public/imagem/perfil/

# Criar a pasta se não existir
mkdir -p app/public/imagem/perfil/

# Dar permissões (Linux/Mac)
chmod 755 app/public/imagem/perfil/
```
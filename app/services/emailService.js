const nodemailer = require('nodemailer');
const pool = require('../config/pool_conexoes');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'vintelo@gmail.com',
        pass: process.env.EMAIL_PASS || 'sua_senha_app'
    }
});

const emailService = {
    async enviarEmail(userId, assunto, mensagem) {
        try {
            const [usuario] = await pool.query('SELECT EMAIL_USUARIO, NOME_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?', [userId]);
            
            if (usuario.length === 0) return false;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: usuario[0].EMAIL_USUARIO,
                subject: assunto,
                html: mensagem
            });

            await pool.query('INSERT INTO EMAILS (ID_USUARIO, EMAIL_USUARIO, ASSUNTO, MENSAGEM) VALUES (?, ?, ?, ?)', 
                [userId, usuario[0].EMAIL_USUARIO, assunto, mensagem]);

            return true;
        } catch (error) {
            console.log('Erro ao enviar email:', error);
            return false;
        }
    },

    async notificarPedido(userId, pedidoId) {
        const assunto = 'Pedido Confirmado - Vintélo';
        const mensagem = `
            <h2>Seu pedido foi confirmado!</h2>
            <p>Pedido #${pedidoId} realizado com sucesso.</p>
            <p>Acompanhe o status em sua conta.</p>
        `;
        return await this.enviarEmail(userId, assunto, mensagem);
    },

    async notificarNovoProduto(userId, nomeProduto) {
        const assunto = 'Novo Produto Disponível - Vintélo';
        const mensagem = `
            <h2>Novo produto que você pode gostar!</h2>
            <p>${nomeProduto} foi adicionado à plataforma.</p>
            <p>Confira agora na Vintélo!</p>
        `;
        return await this.enviarEmail(userId, assunto, mensagem);
    }
};

module.exports = emailService;
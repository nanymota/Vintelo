const denunciaModel = require('../models/denunciaModel');

const denunciaController = {
    listarDenuncias: async function(req, res) {
        try {
            const denuncias = await denunciaModel.listarDenuncias();
            res.render('pages/denuncias', { 
                denuncias: denuncias,
                usuario: req.session.autenticado
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Erro interno do servidor');
        }
    },

    criarDenuncia: async function(req, res) {
        try {
            const dadosDenuncia = {
                ID_USUARIO: req.session.autenticado.id,
                TIPO_ALVO: req.body.tipoAlvo,
                ID_ALVO: req.body.idAlvo,
                MOTIVO: req.body.motivo,
                DESCRICAO: req.body.descricao
            };

            const resultado = await denunciaModel.criarDenuncia(dadosDenuncia);
            
            if (resultado.affectedRows > 0) {
                res.json({ sucesso: true, mensagem: 'Denúncia enviada com sucesso!' });
            } else {
                res.json({ sucesso: false, mensagem: 'Erro ao enviar denúncia' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    analisarDenuncia: async function(req, res) {
        try {
            const id = req.params.id;
            const resultado = await denunciaModel.atualizarStatus(id, 'analisando');
            
            if (resultado.affectedRows > 0) {
                res.json({ sucesso: true, mensagem: 'Análise iniciada!' });
            } else {
                res.json({ sucesso: false, mensagem: 'Erro ao iniciar análise' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    resolverDenuncia: async function(req, res) {
        try {
            const id = req.params.id;
            const resolucao = req.body.resolucao;
            const resultado = await denunciaModel.atualizarStatus(id, 'resolvida', resolucao);
            
            if (resultado.affectedRows > 0) {
                res.json({ sucesso: true, mensagem: 'Denúncia resolvida!' });
            } else {
                res.json({ sucesso: false, mensagem: 'Erro ao resolver denúncia' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    rejeitarDenuncia: async function(req, res) {
        try {
            const id = req.params.id;
            const resultado = await denunciaModel.excluirDenuncia(id);
            
            if (resultado.affectedRows > 0) {
                res.json({ sucesso: true, mensagem: 'Denúncia rejeitada!' });
            } else {
                res.json({ sucesso: false, mensagem: 'Erro ao rejeitar denúncia' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    analisarDenunciaDetalhada: async function(req, res) {
        const id = req.params.id;
//melhorar
        const denunciasEstaticas = {
            '1': {
                ID_DENUNCIA: 1,
                TIPO_ALVO: 'Brecho',
                MOTIVO: 'Perfil inadequado',
                DESCRICAO: 'Usuário está vendendo produtos falsificados e usando imagens de outros perfis.',
                DATA_DENUNCIA: new Date(),
                STATUS: 'pendente',
                USER_ALVO: 'mayte_brecho',
                NOME_ALVO: 'Mayte Silva',
                USER_: 'maria_cliente',
                DENUNCIANTE: 'Maria Cliente'
            },
            '2': {
                ID_DENUNCIA: 2,
                TIPO_ALVO: 'Brecho',
                MOTIVO: 'Comportamento inadequado',
                DESCRICAO: 'Vendedor está sendo agressivo com clientes nos comentários e não entrega produtos.',
                DATA_DENUNCIA: new Date(),
                STATUS: 'analisando',
                USER_ALVO: 'karine_vintage',
                NOME_ALVO: 'Karine Santos',
                USER_DENUNCIANTE: 'ana_compras',
                DENUNCIANTE: 'Ana Compras'
            }
        };
        
        const denuncia = denunciasEstaticas[id] || denunciasEstaticas['1'];
        
        res.render('pages/analisar-denuncia', { 
            denuncia: denuncia,
            usuario: req.session.autenticado
        });
    }
};

module.exports = denunciaController;
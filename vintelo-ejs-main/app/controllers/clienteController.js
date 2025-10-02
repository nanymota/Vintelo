const clienteModel = require("../models/clienteModel");
const { body, validationResult } = require("express-validator");

const clienteController = {

    regrasValidacao: [
        body("nome_usu")
            .isLength({ min: 3, max: 100 }).withMessage("Nome deve ter de 3 a 100 caracteres!"),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!"),
        body("fone_usu")
            .isLength({ min: 10, max: 15 }).withMessage("Digite um celular válido!"),
        body("cpf")
            .isLength({ min: 11, max: 14 }).withMessage("Digite um CPF válido!"),
        body("data_nasc")
            .isDate().withMessage("Digite uma data válida!")
    ],

    listar: async (req, res) => {
        try {
            const clientes = await clienteModel.findAll();
            res.json({
                success: true,
                data: clientes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao listar clientes",
                error: error.message
            });
        }
    },

    buscarPorId: async (req, res) => {
        try {
            const cliente = await clienteModel.findId(req.params.id);
            if (cliente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Cliente não encontrado"
                });
            }
            res.json({
                success: true,
                data: cliente[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao buscar cliente",
                error: error.message
            });
        }
    },

    buscarPorCpf: async (req, res) => {
        try {
            const cliente = await clienteModel.findByCpf(req.params.cpf);
            if (cliente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Cliente não encontrado"
                });
            }
            res.json({
                success: true,
                data: cliente[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao buscar cliente",
                error: error.message
            });
        }
    },

    criar: async (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
                errors: erros.array()
            });
        }

        try {
            const dadosForm = {
                ID_USUARIO: req.body.id_usuario,
                DATA_NASC: req.body.data_nasc, 
                CPF_CLIENTE: req.body.cpf_cliente
            };

            const resultado = await clienteModel.create(dadosForm);
            if (resultado) {
                res.status(201).json({
                    success: true,
                    message: "Cliente criado com sucesso",
                    data: { id: resultado.insertId }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Erro ao criar cliente"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao criar cliente",
                error: error.message
            });
        }
    },

    atualizar: async (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
                errors: erros.array()
            });
        }

        try {
            const dadosForm = {
                DATA_NASC: req.body.data_nasc,
                CPF_CLIENTE: req.body.cpf_cliente
            };

            const resultado = await clienteModel.update(dadosForm, req.params.id);
            if (resultado.affectedRows > 0) {
                res.json({
                    success: true,
                    message: "Cliente atualizado com sucesso"
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "Cliente não encontrado"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao atualizar cliente",
                error: error.message
            });
        }
    },

    deletar: async (req, res) => {
        try {
            const resultado = await clienteModel.delete(req.params.id);
            if (resultado.affectedRows > 0) {
                res.json({
                    success: true,
                    message: "Cliente deletado com sucesso"
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "Cliente não encontrado"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erro ao deletar cliente",
                error: error.message
            });
        }
    }
};

module.exports = clienteController;
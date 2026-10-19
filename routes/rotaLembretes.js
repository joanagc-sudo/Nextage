const express = require("express");
const conn = require("../database");

const router = express.Router();

// Verifica se existe um usuário autenticado.
function verificarLogin(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            erro: "Faça login para continuar."
        });
    }

    next();
}

// Listar os lembretes do usuário logado.
router.get("/api/lembretes", verificarLogin, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;

        const [lembretes] = await conn.query(
            `SELECT id_lembrete, texto
             FROM lembretes
             WHERE id_usuario = ?
             ORDER BY data_criacao DESC, id_lembrete DESC`,
            [idUsuario]
        );

        res.json({ lembretes });

    } catch (erro) {
        console.error("Erro ao buscar lembretes:", erro);

        res.status(500).json({
            erro: "Não foi possível carregar os lembretes."
        });
    }
});

// Adicionar um lembrete.
router.post("/api/lembretes", verificarLogin, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;
        const texto = typeof req.body.texto === "string"
            ? req.body.texto.trim()
            : "";

        if (!texto || texto.length > 500) {
            return res.status(400).json({
                erro: "Informe um lembrete de até 500 caracteres."
            });
        }

        const [resultado] = await conn.query(
            `INSERT INTO lembretes (id_usuario, texto)
             VALUES (?, ?)`,
            [idUsuario, texto]
        );

        res.status(201).json({
            mensagem: "Lembrete salvo com sucesso!",
            lembrete: {
                id_lembrete: resultado.insertId,
                texto
            }
        });

    } catch (erro) {
        console.error("Erro ao salvar lembrete:", erro);

        res.status(500).json({
            erro: "Não foi possível salvar o lembrete."
        });
    }
});

// Excluir um lembrete pertencente ao usuário logado.
router.delete(
    "/api/lembretes/:id",
    verificarLogin,
    async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;
            const idLembrete = Number(req.params.id);

            if (!Number.isSafeInteger(idLembrete) || idLembrete <= 0) {
                return res.status(400).json({
                    erro: "ID de lembrete inválido."
                });
            }

            const [resultado] = await conn.query(
                `DELETE FROM lembretes
                 WHERE id_lembrete = ?
                   AND id_usuario = ?`,
                [idLembrete, idUsuario]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Lembrete não encontrado."
                });
            }

            res.json({
                mensagem: "Lembrete excluído com sucesso."
            });

        } catch (erro) {
            console.error("Erro ao excluir lembrete:", erro);

            res.status(500).json({
                erro: "Não foi possível excluir o lembrete."
            });
        }
    }
);

module.exports = router;
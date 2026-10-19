const express = require("express");
const conn = require("../database");

const router = express.Router();

// Verifica se existe usuário logado
function verificarLogin(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    next();
}

router.get("/cronograma", function (req, res) {
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    res.render("indexCronograma", {
        layout: "/layouts/main",
        query: req.query
    });
});

// Busca o cronograma do usuário logado
router.get(
    "/api/cronograma",
    verificarLogin,
    async function (req, res) {
        try {
            const idUsuario = req.session.usuario.id;

            const [resultados] = await conn.query(
                `SELECT id_cronograma, domingo, segunda, terca,
                        quarta, quinta, sexta, sabado
                 FROM cronograma_estudos
                 WHERE id_usuario = ?
                 LIMIT 1`,
                [idUsuario]
            );

            res.json({
                cronograma: resultados[0] || null
            });
        } catch (erro) {
            console.error("Erro ao buscar cronograma:", erro);

            res.status(500).json({
                erro: "Erro ao buscar cronograma no banco."
            });
        }
    }
);

// Salva ou atualiza o cronograma
router.post(
    "/api/cronograma",
    verificarLogin,
    async function (req, res) {
        try {
            const idUsuario = req.session.usuario.id;

            const dias = [
                "domingo",
                "segunda",
                "terca",
                "quarta",
                "quinta",
                "sexta",
                "sabado"
            ];

            const valores = dias.map(dia => {
                const valor = req.body[dia];

                return typeof valor === "string"
                    ? valor.trim()
                    : "";
            });

            if (valores.some(valor => valor.length > 1000)) {
                return res.status(400).json({
                    erro: "O limite é de 1000 caracteres por dia."
                });
            }

            const [existentes] = await conn.query(
                `SELECT id_cronograma
                 FROM cronograma_estudos
                 WHERE id_usuario = ?
                 LIMIT 1`,
                [idUsuario]
            );

            if (existentes.length > 0) {
                await conn.query(
                    `UPDATE cronograma_estudos
                     SET domingo = ?, segunda = ?, terca = ?,
                         quarta = ?, quinta = ?, sexta = ?, sabado = ?
                     WHERE id_cronograma = ?
                       AND id_usuario = ?`,
                    [
                        ...valores,
                        existentes[0].id_cronograma,
                        idUsuario
                    ]
                );
            } else {
                await conn.query(
                    `INSERT INTO cronograma_estudos
                    (id_usuario, domingo, segunda, terca,
                     quarta, quinta, sexta, sabado)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [idUsuario, ...valores]
                );
            }

            res.json({
                mensagem: "Cronograma salvo com sucesso!"
            });
        } catch (erro) {
            console.error("Erro ao salvar cronograma:", erro);

            res.status(500).json({
                erro: "Erro ao salvar cronograma no banco."
            });
        }
    }
);

module.exports = router;
const express = require("express");
const db = require("../database");

const router = express.Router();

router.get("/desempenho", async (req, res) => {

    try {

        // identifica estudante
        const idUsuario = req.session?.usuario?.id;

        if (!idUsuario) {
            return res.redirect("/login");
        }

        // resumo
        const sqlTotais = `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(certo = 1), 0) AS certas,
                COALESCE(SUM(certo = 0), 0) AS erradas,
                COALESCE(
                    ROUND(
                        SUM(certo = 1) * 100.0 /
                        NULLIF(COUNT(*), 0),
                        2
                    ),
                    0
                ) AS porcentagem
            FROM responder
            WHERE id_usuario = ?
        `;

        // agrupado por disciplina
        const sqlEstatisticas = `
            SELECT
                d.id_disciplina,
                d.nome AS disciplina,
                COUNT(DISTINCT r.id_questao) AS total,

                COUNT(DISTINCT CASE
                    WHEN r.certo = 1 THEN r.id_questao
                END) AS certas,

                COUNT(DISTINCT CASE
                    WHEN r.certo = 0 THEN r.id_questao
                END) AS erradas,

                COALESCE(
                    ROUND(
                        COUNT(DISTINCT CASE
                            WHEN r.certo = 1 THEN r.id_questao
                        END) * 100.0 /
                        NULLIF(COUNT(DISTINCT r.id_questao), 0),
                        2
                    ),
                    0
                ) AS porcentagem

            FROM responder r

            JOIN (
                SELECT DISTINCT
                    qc.id_questao,
                    c.id_disciplina

                FROM questoes_conteudos qc

                JOIN conteudos c
                    ON c.id_conteudo = qc.id_conteudo

            ) AS questoes_disciplinas

                ON questoes_disciplinas.id_questao = r.id_questao

            JOIN disciplinas d
                ON d.id_disciplina = questoes_disciplinas.id_disciplina

            WHERE r.id_usuario = ?

            GROUP BY
                d.id_disciplina,
                d.nome

            ORDER BY d.nome
        `;

        // consultas
        const [resultadoTotais] = await db.query(
            sqlTotais,
            [idUsuario]
        );

        const [estatisticas] = await db.query(
            sqlEstatisticas,
            [idUsuario]
        );

        const totais = resultadoTotais[0];

        // segurança
        const estatisticasJSON = JSON.stringify(estatisticas)
            .replace(/</g, "\\u003c")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");

        // carrega a página
        res.render("indexDesempenho", {
            layout: "layouts/main",
            totais,
            estatisticas,
            estatisticasJSON
        });

    } catch (erro) {

        console.error("Erro ao carregar desempenho:", erro);

        res.status(500).send(
            "Erro ao carregar a página de desempenho."
        );

    }

});

module.exports = router;
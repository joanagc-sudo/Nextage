
const express = require("express");
const db = require("../database");

const router = express.Router();

// rota de desempenho
router.get("/desempenho", async (req, res) => {

    try {

        // identifica o estudante logado
        const idUsuario = req.session?.usuario?.id;

        // verifica se existe usuário na sessão
        if (!idUsuario) {
            return res.redirect("/login");
        }

        // consulta os totais de questões respondidas
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

        // Consulta o desempenho agrupado por disciplina
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

            -- Relaciona questões com suas disciplinas
            JOIN (
                SELECT DISTINCT
                    qc.id_questao,
                    c.id_disciplina

                FROM questoes_conteudos qc

                JOIN conteudos c
                    ON c.id_conteudo = qc.id_conteudo

            ) AS questoes_disciplinas

                ON questoes_disciplinas.id_questao = r.id_questao

            -- Obtém o nome da disciplina
            JOIN disciplinas d
                ON d.id_disciplina = questoes_disciplinas.id_disciplina

            -- Filtra as respostas do estudante
            WHERE r.id_usuario = ?

            -- Agrupa os resultados por disciplina
            GROUP BY
                d.id_disciplina,
                d.nome

            -- Ordena pelo nome da disciplina
            ORDER BY d.nome
        `;

        // executa a consulta dos totais
        const [resultadoTotais] = await db.query(
            sqlTotais,
            [idUsuario]
        );

        // executa a consulta por disciplina
        const [estatisticas] = await db.query(
            sqlEstatisticas,
            [idUsuario]
        );

        // primeira linha do resultado
        const totais = resultadoTotais[0];

        // converte os dados para JSON com proteção contra caracteres especiais
        const estatisticasJSON = JSON.stringify(estatisticas)
            .replace(/</g, "\\u003c")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");

        // envia os dados para a página
        res.render("indexDesempenho", {
            layout: "layouts/main",
            totais,
            estatisticas,
            estatisticasJSON
        });

    } catch (erro) {

        // exibe o erro no terminal
        console.error("Erro ao carregar desempenho:", erro);

        // retorna uma resposta de erro
        res.status(500).send(
            "Erro ao carregar a página de desempenho."
        );

    }

});

// exporta as rotas
module.exports = router;

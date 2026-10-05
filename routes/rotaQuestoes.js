const express = require("express");

const conn = require("../database");

const router = express.Router();

router.get("/questoes", async function (req, res) {

    // 1) Questões + vestibular + disciplinas/conteúdos

    const [questoesRows] = await conn.query(`
        SELECT
            q.id_questao,
            q.enunciado,
            (q.imagem IS NOT NULL) AS tem_imagem,
            v.nome AS vestibular,
            v.banca,
            v.ano,
            GROUP_CONCAT(
                DISTINCT d.nome
                ORDER BY d.nome
                SEPARATOR ', '
            ) AS disciplinas,
            GROUP_CONCAT(
                DISTINCT c.nome
                ORDER BY c.nome
                SEPARATOR ', '
            ) AS conteudos

        FROM questoes q

        JOIN vestibulares v
            ON v.id_vestibular = q.id_vestibular

        LEFT JOIN questoes_conteudos qc
            ON qc.id_questao = q.id_questao

        LEFT JOIN conteudos c
            ON c.id_conteudo = qc.id_conteudo

        LEFT JOIN disciplinas d
            ON d.id_disciplina = c.id_disciplina

        GROUP BY
            q.id_questao,
            q.enunciado,
            q.imagem,
            v.id_vestibular,
            v.nome,
            v.banca,
            v.ano

        ORDER BY q.id_questao
    `);


    const questoes = questoesRows.map(q => ({

        ...q,

        tem_imagem: Boolean(q.tem_imagem),

        alternativas: []

    }));

    // 2) Alternativas

    if (questoes.length > 0) {

    const ids = questoes.map(q => q.id_questao);
        
        const [alternativas] = await conn.query(
            `
            SELECT
                id_alternativas,
                questoes_id_questao,
                texto

            FROM alternativas

            WHERE questoes_id_questao IN (?)

            ORDER BY
                questoes_id_questao,
                id_alternativas
            `,
            [ids]
        );


        const porId = new Map(
            questoes.map(
                q => [q.id_questao, q]
            )
        );


        for (const alt of alternativas) {

            const questao =
                porId.get(
                    alt.questoes_id_questao
                );


            questao.alternativas.push({

                id_alternativas:
                    alt.id_alternativas,

                letra:
                    String.fromCharCode(
                        65 +
                        questao.alternativas.length
                    ),

                texto:
                    alt.texto

            });

        }

    }


    res.render(
        "indexQuestoes",
        {

            layout: "/layouts/main",

            query: req.query,

            questoes

        }
    );

});



function detectarMime(buf) {

    if (
        buf[0] === 0x89 &&
        buf[1] === 0x50
    ) {
        return "image/png";
    }


    if (
        buf[0] === 0xFF &&
        buf[1] === 0xD8
    ) {
        return "image/jpeg";
    }


    if (
        buf[0] === 0x47 &&
        buf[1] === 0x49
    ) {
        return "image/gif";
    }


    if (
        buf.slice(8, 12).toString() === "WEBP"
    ) {
        return "image/webp";
    }


    return "application/octet-stream";

}


router.get(
    "/questoes/:id/imagem",
    async function (req, res) {

        const [[row]] = await conn.query(
            `
            SELECT imagem
            FROM questoes
            WHERE id_questao = ?
            `,
            [req.params.id]
        );


        if (
            !row ||
            !row.imagem
        ) {

            return res.sendStatus(404);

        }


        res.set(
            "Cache-Control",
            "public, max-age=86400"
        );


        res
            .type(detectarMime(row.imagem))
            .send(row.imagem);

    }
);



router.post(
    "/questoes/:id/responder",
    express.json(),
    async function (req, res) {

        const idQuestao =
            Number(req.params.id);

        const idAlternativa =
            Number(req.body.id_alternativa);


        const [[questao]] =
            await conn.query(
                `
                SELECT
                    id_alternativa_correta,
                    explicacao

                FROM questoes

                WHERE id_questao = ?
                `,
                [idQuestao]
            );


        if (!questao) {

            return res.status(404).json({
                erro: "Questão não encontrada"
            });

        }


        const acertou =
            questao.id_alternativa_correta ===
            idAlternativa;


        // Pega o ID do usuário logado

        const idUsuario =
            req.session?.usuario?.id;


        if (idUsuario) {

            await conn.query(
                `
                INSERT INTO responder
                (
                    id_usuario,
                    id_questao,
                    data,
                    certo
                )

                VALUES
                (
                    ?,
                    ?,
                    CURDATE(),
                    ?
                )

                ON DUPLICATE KEY UPDATE
                    data = CURDATE(),
                    certo = ?
                `,
                [
                    idUsuario,
                    idQuestao,
                    acertou ? 1 : 0,
                    acertou ? 1 : 0
                ]
            );

        }


        res.json({

            acertou,

            id_correta:
                questao.id_alternativa_correta,

            explicacao:
                questao.explicacao

        });

    });

router.get("/api/filtros", async function (req, res) {
    const [disciplinas] = await conn.query(
        "SELECT id_disciplina AS id, nome FROM disciplinas ORDER BY nome"
    );

    const [conteudos] = await conn.query(
        "SELECT id_conteudo AS id, nome, id_disciplina FROM conteudos ORDER BY nome"
    );

    const [bancas] = await conn.query(
        "SELECT DISTINCT banca AS nome FROM vestibulares ORDER BY banca"
    );

    const [anos] = await conn.query(
        "SELECT DISTINCT ano AS nome FROM vestibulares ORDER BY ano DESC"
    );

    res.json({
        disciplinas,
        conteudos,
        // banca e ano não têm tabela própria, então o valor é o próprio nome
        bancas: bancas.map(b => ({ id: b.nome, nome: b.nome })),
        anos: anos.map(a => ({ id: a.nome, nome: String(a.nome) }))
    });
});
module.exports = router;
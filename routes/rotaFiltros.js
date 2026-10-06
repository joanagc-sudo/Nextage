

const express = require("express");

const conn = require("../database");

const router = express.Router();

//quando acionar o metodo post, executa essa função
router.post("/filtar", async function (req, res) {

    try {

        //dados recebidos pelo formulario: seleções dos filtros
        //ve oq o navegador enviou
        console.log("REQ.BODY:", req.body);

        //garante que as opções selecionadas sempre sejam arrays
        const disciplinas = Array.isArray(req.body.Disciplina)
            //se for array
            ? req.body.Disciplina
            : req.body.Disciplina
                //se não for array
                ? [req.body.Disciplina]
                : [];

        const conteudos = Array.isArray(req.body["Conteúdo"])
            ? req.body["Conteúdo"]
            : req.body["Conteúdo"]
                ? [req.body["Conteúdo"]]
                : [];

        const bancas = Array.isArray(req.body.Banca)
            ? req.body.Banca
            : req.body.Banca
                ? [req.body.Banca]
                : [];

        const anos = Array.isArray(req.body.Ano)
            ? req.body.Ano
            : req.body.Ano
                ? [req.body.Ano]
                : [];

        const palavraChave = req.body["palavra-chave"] || "";


        //montar filtros para consulta

        //guarda partes do sql
        const filtros = [];

        //guarda os valores
        const parametros = [];


        // Disciplina

        //se selecionou pelo menos uma
        if (disciplinas.length > 0) {

            //pega as selecionadas
            filtros.push(
                `d.id_disciplina IN (${disciplinas.map(() => "?").join(", ")})`
            );

            parametros.push(...disciplinas);
        }

        // Conteúdo

        if (conteudos.length > 0) {

            filtros.push(
                `c.id_conteudo IN (${conteudos.map(() => "?").join(", ")})`
            );

            parametros.push(...conteudos);
        }

        // Banca

        if (bancas.length > 0) {

            filtros.push(
                `v.banca IN (${bancas.map(() => "?").join(", ")})`
            );

            parametros.push(...bancas);
        }

        // Ano

        if (anos.length > 0) {

            filtros.push(
                `v.ano IN (${anos.map(() => "?").join(", ")})`
            );

            parametros.push(...anos);
        }


        // Palavra-chave
  
        if (palavraChave.trim() !== "") {

            filtros.push(
                `q.enunciado LIKE ?`
            );

            parametros.push(
                `%${palavraChave.trim()}%`
            );
        }


  
        // converte os parametros para consulta no mysql com and entre cada um dos filtros

        const where = filtros.length > 0
            ? `WHERE ${filtros.join(" AND ")}`
            : "";


        console.log("WHERE:", where);
        console.log("PARAMETROS:", parametros);


        // ============================================================
        // 4. BUSCA AS QUESTÕES
        // ============================================================

        const [questoesRows] = await conn.query(
            `
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


            ${where}


            GROUP BY

                q.id_questao,

                q.enunciado,

                q.imagem,

                v.id_vestibular,

                v.nome,

                v.banca,

                v.ano


            ORDER BY q.id_questao
            `,
            parametros
        );


        // ============================================================
        // 5. PREPARA AS QUESTÕES
        // ============================================================

        const questoes = questoesRows.map(q => ({

            ...q,

            tem_imagem: Boolean(q.tem_imagem),

            alternativas: []

        }));


        // ============================================================
        // 6. BUSCA AS ALTERNATIVAS
        // ============================================================

        if (questoes.length > 0) {

            const ids = questoes.map(
                q => q.id_questao
            );


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


            // ========================================================
            // 7. CRIA MAPA DAS QUESTÕES
            // ========================================================

            const porId = new Map(
                questoes.map(
                    q => [
                        q.id_questao,
                        q
                    ]
                )
            );


            // ========================================================
            // 8. ADICIONA AS ALTERNATIVAS À QUESTÃO
            // ========================================================

            for (const alt of alternativas) {

                const questao = porId.get(
                    alt.questoes_id_questao
                );


                if (!questao) {
                    continue;
                }


                questao.alternativas.push({

                    id_alternativas:
                        alt.id_alternativas,

                    letra:
                        String.fromCharCode(
                            65 + questao.alternativas.length
                        ),

                    texto:
                        alt.texto

                });

            }

        }


        // ============================================================
        // 9. RENDERIZA A PÁGINA
        // ============================================================

        return res.render(
            "indexQuestoes",
            {

                layout: "/layouts/main",

                query: req.query,

                questoes

            }
        );


    } catch (erro) {

        // ============================================================
        // 10. TRATAMENTO DE ERRO
        // ============================================================

        console.error(
            "Erro ao filtrar questões:",
            erro
        );


        return res.status(500).send(
            "Erro ao filtrar questões."
        );

    }

});


module.exports = router;

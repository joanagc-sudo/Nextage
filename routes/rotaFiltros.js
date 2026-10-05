/*
 SELECT distinct q.* 
FROM nextage.questoes q 
join nextage.vestibulares v on v.id_vestibular = q.id_vestibular
join nextage.questoes_conteudos qc on q.id_questao = qc.id_questao 
join nextage.conteudos c on c.id_conteudo = qc.id_conteudo 
join nextage.disciplinas d on d.id_disciplina = c.id_disciplina
where d.id_disciplina in (1, 2) 
and c.id_conteudo in (1,5) 
and v.banca like ('FUVEST') 
and v.ano in (2002,2003);
 */

const express = require("express");

const conn = require("../database");

const router = express.Router();


router.get("/api/filtros", async function (req, res) {

    const [disciplinas] =
        await conn.query(
            `
            SELECT
                id_disciplina AS id,
                nome
            FROM disciplinas
            ORDER BY nome
            `
        );


    const [conteudos] =
        await conn.query(
            `
            SELECT
                id_conteudo AS id,
                nome,
                id_disciplina
            FROM conteudos
            ORDER BY nome
            `
        );


    const [bancas] =
        await conn.query(
            `
            SELECT DISTINCT
                banca AS nome
            FROM vestibulares
            ORDER BY banca
            `
        );


    const [anos] =
        await conn.query(
            `
            SELECT DISTINCT
                ano AS nome
            FROM vestibulares
            ORDER BY ano DESC
            `
        );


    res.json({

        disciplinas,

        conteudos,

        bancas: bancas.map(b => ({
            id: b.nome,
            nome: b.nome
        })),

        anos: anos.map(a => ({
            id: a.nome,
            nome: String(a.nome)
        }))

    });

});


module.exports = router;

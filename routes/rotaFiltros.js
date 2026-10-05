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

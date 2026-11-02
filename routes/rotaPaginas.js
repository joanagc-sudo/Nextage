
const express = require("express");
const db = require("../database");

const router = express.Router();

// Teste da rota
router.get("/teste", (req, res) => {
    res.send("ROTA FUNCIONANDO!");
});

// Tela inicial
router.get("/tela-inicial", (req, res) => {
    res.render("indexTelaInicial", {
        layout: "/layouts/main",
        query: req.query
    });
});

// Geografia: tela padrão de materiais
router.get("/materiais", (req, res) => {
    res.render("indexMateriais", {
        layout: "/layouts/main",
        query: req.query
    });
});

// Rotas das disciplinas
const disciplinas = {
    "/biologia": "indexBiologia",
    "/espanhol": "indexEspanhol",
    "/fisica": "indexFisica",
    "/filosofia": "indexFilosofia",
    "/historia": "indexHistoria",
    "/ingles": "indexIngles",
    "/matematica": "indexMatematica",
    "/portugues": "indexPortugues",
    "/quimica": "indexQuimica",
    "/sociologia": "indexSociologia"
};

Object.entries(disciplinas).forEach(([rota, arquivo]) => {
    router.get(rota, (req, res) => {
        res.render(arquivo, {
            layout: "/layouts/main",
            query: req.query
        });
    });
});

// Consultar disciplinas e suas páginas no banco de dados
router.get("/api/disciplinas-paginas", async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                d.id_disciplina,
                d.nome,
                dp.rota
            FROM disciplinas d
            INNER JOIN disciplinas_paginas dp
                ON d.id_disciplina = dp.id_disciplina
            ORDER BY d.nome ASC
        `);

        res.json(resultado);

    } catch (erro) {
        console.error("Erro ao consultar disciplinas:", erro);

        res.status(500).json({
            erro: "Não foi possível consultar as disciplinas."
        });
    }
});

// Tela de disciplinas
router.get("/disciplinas", (req, res) => {
    res.render("indexDisciplinas", {
        layout: "/layouts/main",
        query: req.query
    });
});

module.exports = router;

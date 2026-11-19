
const express = require("express");
const conn = require("../database");

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

//Atalho de metodos de tudo
router.get("/metodos-estudo", (req, res) => {
    res.render("estudante/metodosEstudo", {
        layout: "/layouts/main"
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


// Buscar disciplinas cadastradas no MySQL
router.get("/api/disciplinas-paginas", async (req, res) => {

    try {

        const [disciplinas] = await conn.query(`
            SELECT id_disciplina, nome
            FROM disciplinas
            ORDER BY nome ASC
        `);

        // Relaciona cada disciplina à sua página
        const rotas = {
            "geografia": "/materiais",
            "biologia": "/biologia",
            "espanhol": "/espanhol",
            "fisica": "/fisica",
            "filosofia": "/filosofia",
            "historia": "/historia",
            "ingles": "/ingles",
            "matematica": "/matematica",
            "portugues": "/portugues",
            "quimica": "/quimica",
            "sociologia": "/sociologia"
        };

        const resultado = disciplinas.map(disciplina => {

            const nomeNormalizado = disciplina.nome
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();

            return {
                ...disciplina,
                rota: rotas[nomeNormalizado] || null
            };

        }).filter(disciplina => disciplina.rota);

        return res.json(resultado);

    } catch (erro) {

        console.error("ERRO AO BUSCAR DISCIPLINAS:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar disciplinas no banco de dados."
        });

    }

});


// Buscar conteúdos de uma disciplina
router.get("/api/conteudos/:id_disciplina", async (req, res) => {
    try {
        const idDisciplina = Number(req.params.id_disciplina);

        if (!Number.isInteger(idDisciplina) || idDisciplina <= 0) {
            return res.status(400).json({
                erro: "ID da disciplina inválido."
            });
        }

        const [conteudos] = await conn.query(`
            SELECT
                id_conteudo,
                nome
            FROM conteudos
            WHERE id_disciplina = ?
            ORDER BY id_conteudo ASC
        `, [idDisciplina]);

        res.json(conteudos);

    } catch (erro) {
        console.error("ERRO AO BUSCAR CONTEÚDOS:", erro);

        res.status(500).json({
            erro: "Erro ao buscar conteúdos no banco de dados."
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

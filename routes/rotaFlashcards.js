
const express = require("express");
const router = express.Router();
const conn = require("../database");

// Verifica se o administrador está autenticado
function verificarAdministrador(req, res, next) {
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }

    next();
}

// Buscar conteúdos para associar aos flashcards
async function buscarConteudos() {
    const [conteudos] = await conn.query(`
        SELECT
            c.id_conteudo,
            c.nome AS nome_conteudo,
            d.nome AS nome_disciplina
        FROM conteudos c
        INNER JOIN disciplinas d
            ON c.id_disciplina = d.id_disciplina
        ORDER BY d.nome, c.nome
    `);

    return conteudos;
}

// Listar flashcards cadastrados
router.get(
    "/admin/flashcards",
    verificarAdministrador,
    async (req, res) => {
        try {
            const [flashcards] = await conn.query(`
                SELECT
                    f.id_flashcard,
                    f.pergunta,
                    f.resposta,
                    c.nome AS nome_conteudo,
                    d.nome AS nome_disciplina
                FROM flashcards f
                INNER JOIN conteudos c
                    ON f.id_conteudo = c.id_conteudo
                INNER JOIN disciplinas d
                    ON c.id_disciplina = d.id_disciplina
                ORDER BY f.id_flashcard DESC
            `);

            res.render("administrador/flashcards", {
                layout: "layouts/mainAdmin",
                admin: req.session.admin,
                flashcards
            });

        } catch (erro) {
            console.error("Erro ao buscar flashcards:", erro);
            res.status(500).send("Erro ao carregar flashcards.");
        }
    }
);

// Página de cadastro
router.get(
    "/admin/flashcards/novo",
    verificarAdministrador,
    async (req, res) => {
        try {
            const conteudos = await buscarConteudos();

            res.render("administrador/formFlashcard", {
                layout: "layouts/main",
                admin: req.session.admin,
                conteudos,
                flashcard: null,
                editando: false
            });

        } catch (erro) {
            console.error("Erro ao carregar cadastro:", erro);
            res.status(500).send("Erro ao carregar formulário.");
        }
    }
);

// Cadastrar flashcard
router.post(
    "/admin/flashcards/novo",
    verificarAdministrador,
    async (req, res) => {
        try {
            const { id_conteudo, pergunta, resposta } = req.body;

            if (!id_conteudo || !pergunta?.trim() || !resposta?.trim()) {
                return res.status(400).send("Preencha todos os campos.");
            }

            await conn.query(`
                INSERT INTO flashcards
                (id_conteudo, pergunta, resposta)
                VALUES (?, ?, ?)
            `, [
                id_conteudo,
                pergunta.trim(),
                resposta.trim()
            ]);

            res.redirect("/admin/flashcards");

        } catch (erro) {
            console.error("Erro ao cadastrar flashcard:", erro);
            res.status(500).send("Erro ao cadastrar flashcard.");
        }
    }
);

// Página de edição
router.get(
    "/admin/flashcards/editar/:id",
    verificarAdministrador,
    async (req, res) => {
        try {
            const id = req.params.id;

            const [flashcards] = await conn.query(
                "SELECT * FROM flashcards WHERE id_flashcard = ?",
                [id]
            );

            if (flashcards.length === 0) {
                return res.redirect("/admin/flashcards");
            }

            const flashcard = flashcards[0];

            const conteudos = await buscarConteudos();

            // Identifica o conteúdo relacionado ao flashcard
            const conteudosComSelecao = conteudos.map(conteudo => ({
                ...conteudo,
                selecionado:
                    Number(conteudo.id_conteudo) ===
                    Number(flashcard.id_conteudo)
            }));

            res.render("administrador/formFlashcard", {
                layout: "layouts/main",
                admin: req.session.admin,
                flashcard,
                conteudos: conteudosComSelecao,
                editando: true
            });

        } catch (erro) {
            console.error("Erro ao buscar flashcard para edição:", erro);
            res.status(500).send("Erro ao carregar flashcard para edição.");
        }
    }
);

// Salvar edição
router.post(
    "/admin/flashcards/editar/:id",
    verificarAdministrador,
    async (req, res) => {
        try {
            const id = req.params.id;
            const { id_conteudo, pergunta, resposta } = req.body;

            if (!id_conteudo || !pergunta?.trim() || !resposta?.trim()) {
                return res.status(400).send("Preencha todos os campos.");
            }

            const [resultado] = await conn.query(`
                UPDATE flashcards
                SET
                    id_conteudo = ?,
                    pergunta = ?,
                    resposta = ?
                WHERE id_flashcard = ?
            `, [
                id_conteudo,
                pergunta.trim(),
                resposta.trim(),
                id
            ]);

            if (resultado.affectedRows === 0) {
                return res.status(404).send("Flashcard não encontrado.");
            }

            res.redirect("/admin/flashcards");

        } catch (erro) {
            console.error("Erro ao editar flashcard:", erro);
            res.status(500).send("Erro ao editar flashcard.");
        }
    }
);

// Excluir flashcard
router.post(
    "/admin/flashcards/excluir/:id",
    verificarAdministrador,
    async (req, res) => {
        try {
            await conn.query(`
                DELETE FROM flashcards
                WHERE id_flashcard = ?
            `, [req.params.id]);

            res.redirect("/admin/flashcards");

        } catch (erro) {
            console.error("Erro ao excluir flashcard:", erro);
            res.status(500).send("Erro ao excluir flashcard.");
        }
    }
);

module.exports = router;
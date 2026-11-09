
const express = require("express");
const conn = require("../database");

const router = express.Router();

// Verifica se o estudante está logado
function verificarEstudante(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    // Impede que administradores acessem a área do estudante
    if (Number(req.session.usuario.tipo_usuario) === 1) {
        return res.redirect("/admin");
    }

    next();
}

// Validar IDs recebidos pela URL
function validarId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Página inicial: listar disciplinas que possuem flashcards
router.get(
    "/flashcards",
    verificarEstudante,
    async (req, res) => {
        try {
            const [disciplinas] = await conn.query(`
                SELECT DISTINCT
                    d.id_disciplina,
                    d.nome AS nome_disciplina
                FROM disciplinas d
                INNER JOIN conteudos c
                    ON c.id_disciplina = d.id_disciplina
                INNER JOIN flashcards f
                    ON f.id_conteudo = c.id_conteudo
                ORDER BY d.nome ASC
            `);

            res.render("estudante/flashcards", {
                layout: "layouts/main",
                disciplinas,
                conteudos: null,
                nomeDisciplina: null
            });

        } catch (erro) {
            console.error("Erro ao buscar disciplinas:", erro);
            res.status(500).send("Erro ao carregar disciplinas.");
        }
    }
);

// Listar conteúdos de uma disciplina
router.get(
    "/flashcards/disciplina/:id",
    verificarEstudante,
    async (req, res) => {
        try {
            const idDisciplina = req.params.id;

            if (!validarId(idDisciplina)) {
                return res.status(400).send("Disciplina inválida.");
            }

            const [disciplinas] = await conn.query(
                `SELECT id_disciplina, nome
                 FROM disciplinas
                 WHERE id_disciplina = ?`,
                [idDisciplina]
            );

            if (disciplinas.length === 0) {
                return res.redirect("/flashcards");
            }

            const [conteudos] = await conn.query(`
                SELECT
                    c.id_conteudo,
                    c.nome AS nome_conteudo,
                    COUNT(f.id_flashcard) AS quantidade_flashcards
                FROM conteudos c
                INNER JOIN flashcards f
                    ON f.id_conteudo = c.id_conteudo
                WHERE c.id_disciplina = ?
                GROUP BY c.id_conteudo, c.nome
                ORDER BY c.nome ASC
            `, [idDisciplina]);

            res.render("estudante/flashcards", {
                layout: "layouts/mainAdmin",
                disciplinas: null,
                conteudos,
                nomeDisciplina: disciplinas[0].nome
            });

        } catch (erro) {
            console.error("Erro ao buscar conteúdos:", erro);
            res.status(500).send("Erro ao carregar conteúdos.");
        }
    }
);

// Abrir a tela de estudo de um conteúdo
router.get(
    "/flashcards/estudar/:id",
    verificarEstudante,
    async (req, res) => {
        try {
            const idConteudo = req.params.id;

            if (!validarId(idConteudo)) {
                return res.status(400).send("Conteúdo inválido.");
            }

            const [flashcards] = await conn.query(`
                SELECT
                    f.id_flashcard,
                    f.pergunta,
                    f.resposta,
                    c.id_conteudo,
                    c.nome AS nome_conteudo,
                    d.nome AS nome_disciplina
                FROM flashcards f
                INNER JOIN conteudos c
                    ON f.id_conteudo = c.id_conteudo
                INNER JOIN disciplinas d
                    ON c.id_disciplina = d.id_disciplina
                WHERE c.id_conteudo = ?
                ORDER BY f.id_flashcard ASC
            `, [idConteudo]);

            if (flashcards.length === 0) {
                return res.redirect("/flashcards");
            }

            res.render("estudante/estudarFlashcards", {
                layout: "layouts/main",
                flashcards,
                nomeConteudo: flashcards[0].nome_conteudo,
                nomeDisciplina: flashcards[0].nome_disciplina
            });

        } catch (erro) {
            console.error("Erro ao carregar flashcards:", erro);
            res.status(500).send("Erro ao carregar flashcards.");
        }
    }
);

module.exports = router;

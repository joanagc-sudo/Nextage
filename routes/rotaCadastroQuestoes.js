const express = require("express");
const multer = require("multer");

const db = require("../database");

const router = express.Router();

// Upload em memória (a imagem vai direto para o MEDIUMBLOB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ---------- Página ----------
router.get("/cadastro-questoes", function (req, res) {
    res.render("indexCadastroQuestoes", {
        layout: "/layouts/main",
        query: req.query
    });
});

// ---------- APIs que alimentam os filtros ----------
router.get("/api/vestibulares", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_vestibular AS id,
                    CONCAT(nome, ' ', ano, ' (', edicao, 'ª edição)') AS nome
             FROM vestibulares
             ORDER BY ano DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar vestibulares" });
    }
});

router.get("/api/conteudos", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_conteudo AS id, nome, id_disciplina
             FROM conteudos
             ORDER BY nome`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar conteúdos" });
    }
});

// ---------- Cadastro da questão ----------
router.post("/cadastro-questoes", upload.single("imagem"), async (req, res) => {
    const { id_vestibular, id_conteudo, enunciado, correta,
            alt_a, alt_b, alt_c, alt_d, alt_e } = req.body;

    const letras = ["a", "b", "c", "d", "e"];
    const textos = { a: alt_a, b: alt_b, c: alt_c, d: alt_d, e: alt_e };
    const conteudos = [].concat(id_conteudo || []);

    // Validação básica
    if (!id_vestibular || conteudos.length === 0 || !enunciado || !letras.includes(correta)) {
        return res.status(400).send("Preencha todos os campos obrigatórios.");
    }

    const imagem = req.file ? req.file.buffer : null;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Questão (id_alternativa_correta provisório)
        const [q] = await connection.query(
            `INSERT INTO questoes (id_vestibular, id_alternativa_correta, enunciado, imagem)
             VALUES (?, 0, ?, ?)`,
            [id_vestibular, enunciado, imagem]
        );
        const idQuestao = q.insertId;

        // 2. Alternativas
        let idCorreta = null;
        for (const letra of letras) {
            const [alt] = await connection.query(
                `INSERT INTO alternativas (questoes_id_questao, texto) VALUES (?, ?)`,
                [idQuestao, textos[letra]]
            );
            if (letra === correta) idCorreta = alt.insertId;
        }

        // 3. Define a alternativa correta
        await connection.query(
            `UPDATE questoes SET id_alternativa_correta = ? WHERE id_questao = ?`,
            [idCorreta, idQuestao]
        );

        // 4. Conteúdos relacionados
        for (const c of conteudos) {
            await connection.query(
                `INSERT INTO questoes_conteudos (id_questao, id_conteudo) VALUES (?, ?)`,
                [idQuestao, c]
            );
        }

        await connection.commit();
        res.redirect("/cadastro-questoes?sucesso=1");
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send("Erro ao cadastrar questão.");
    } finally {
        connection.release();
    }
});

module.exports = router;
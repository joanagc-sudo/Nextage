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
router.get("/api/filtros", async (req, res) => {
    try {
        const [disciplinas] = await db.query(
            `SELECT id_disciplina AS id, nome FROM disciplinas ORDER BY nome`
        );

        const [conteudos] = await db.query(
            `SELECT id_conteudo AS id, nome, id_disciplina FROM conteudos ORDER BY nome`
        );

        const [bancas] = await db.query(
            `SELECT DISTINCT banca AS id, banca AS nome FROM vestibulares ORDER BY banca`
        );

        const [anosRows] = await db.query(
            `SELECT ano AS id, ano AS nome,
                    GROUP_CONCAT(DISTINCT banca SEPARATOR '||') AS bancas
             FROM vestibulares
             GROUP BY ano
             ORDER BY ano DESC`
        );

        // transforma "INEP||FUVEST" em ["INEP", "FUVEST"]
        const anos = anosRows.map(a => ({
            ...a,
            bancas: a.bancas ? a.bancas.split("||") : []
        }));

        res.json({ disciplinas, conteudos, bancas, anos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar filtros" });
    }
});
// ---------- Cadastro da questão ----------
router.post("/cadastro-questoes", upload.single("imagem"), async (req, res) => {
    const { banca, ano, id_conteudo, enunciado, correta,
        alt_a, alt_b, alt_c, alt_d, alt_e } = req.body;

   // console.log(req.body);

    const letras = ["a", "b", "c", "d", "e"];
    const textos = { a: alt_a, b: alt_b, c: alt_c, d: alt_d, e: alt_e };
    const conteudos = [].concat(id_conteudo || []);

    if (!banca || !ano || conteudos.length === 0 || !enunciado?.trim() || !letras.includes(correta)) {
        return res.status(400).send("Preencha enunciado, banca, ano, conteúdo e a alternativa correta.");
    }
    if (!textos[correta] || !textos[correta].trim()) {
        return res.status(400).send("A alternativa marcada como correta precisa ser preenchida.");
    }

    const imagem = req.file ? req.file.buffer : null;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [vest] = await connection.query(
    `SELECT id_vestibular FROM vestibulares WHERE banca = ? AND ano = ? LIMIT 1`,
    [banca, ano]
);
if (vest.length === 0) {
    await connection.rollback();
    return res.status(400).send("Não existe vestibular com essa banca e ano.");
}
const id_vestibular = vest[0].id_vestibular;
        const [q] = await connection.query(
            `INSERT INTO questoes (id_vestibular, id_alternativa_correta, enunciado, imagem)
             VALUES (?, 0, ?, ?)`,
            [id_vestibular, enunciado.trim(), imagem]
        );
        const idQuestao = q.insertId;

        // Só insere as alternativas preenchidas
        let idCorreta = null;
        for (const letra of letras) {
            const texto = textos[letra]?.trim();
            if (!texto) continue;

            const [alt] = await connection.query(
                `INSERT INTO alternativas (questoes_id_questao, texto) VALUES (?, ?)`,
                [idQuestao, texto]
            );
            if (letra === correta) idCorreta = alt.insertId;
        }

        await connection.query(
            `UPDATE questoes SET id_alternativa_correta = ? WHERE id_questao = ?`,
            [idCorreta, idQuestao]
        );

        for (const c of conteudos) {
            await connection.query(
                `INSERT INTO questoes_conteudos (id_questao, id_conteudo) VALUES (?, ?)`,
                [idQuestao, c]
            );
        }

        await connection.commit();
        res.redirect("/cadastro-questoes?sucesso=1");
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).send("Erro ao cadastrar questão.");
    } finally {
        if (connection) connection.release();
    }
});
module.exports = router;

const express = require("express");
const multer = require("multer");

const db = require("../database");

const router = express.Router();

// Upload em memória (a imagem vai direto para o MEDIUMBLOB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

const letras = ["a", "b", "c", "d", "e"];

// ---------- Middleware: só administradores ----------
function apenasAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ erro: "Faça login." });
    }
    if (Number(req.session.usuario.tipo_usuario) !== 1) {
        return res.status(403).json({ erro: "Acesso permitido apenas para administradores." });
    }
    next();
}

// ---------- Página de alteração ----------
router.get("/alterar-questoes/:id", apenasAdmin, function (req, res) {
    res.render("indexAlterarQuestoes", {
        layout: "/layouts/main",
        id: req.params.id,
        query: req.query
    });
});

// ---------- Dados da questão (para pré-preencher o formulário) ----------
// Caminho exclusivo para não conflitar com rotaQuestoes
router.get("/api/questoes-admin/:id", apenasAdmin, async (req, res) => {
    try {
        const id = req.params.id;

        const [[q]] = await db.query(
            `SELECT q.id_questao, q.enunciado, q.id_alternativa_correta,
                    (q.imagem IS NOT NULL) AS tem_imagem, v.banca, v.ano
             FROM questoes q
             JOIN vestibulares v ON v.id_vestibular = q.id_vestibular
             WHERE q.id_questao = ?`,
            [id]
        );

        if (!q) {
            return res.status(404).json({ erro: "Questão não encontrada" });
        }

        const [alts] = await db.query(
            `SELECT id_alternativas, texto FROM alternativas
             WHERE questoes_id_questao = ?
             ORDER BY id_alternativas`,
            [id]
        );

        const [conts] = await db.query(
            `SELECT id_conteudo FROM questoes_conteudos WHERE id_questao = ?`,
            [id]
        );

        // Alternativas viram A, B, C... pela ordem do ID
        const alternativas = {};
        alts.forEach((a, i) => {
            alternativas[letras[i]] = a.texto;
        });

        const idxCorreta = alts.findIndex(
            a => a.id_alternativas === q.id_alternativa_correta
        );

        res.json({
            enunciado: q.enunciado,
            banca: q.banca,
            ano: String(q.ano),
            tem_imagem: !!q.tem_imagem,
            alternativas,
            correta: idxCorreta >= 0 ? letras[idxCorreta] : "",
            conteudos: conts.map(c => String(c.id_conteudo))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar questão" });
    }
});

// ---------- Atualização ----------
router.post("/alterar-questoes/:id", apenasAdmin, upload.single("imagem"), async (req, res) => {
    const idQuestao = req.params.id;

    const { banca, ano, id_conteudo, enunciado, correta,
        alt_a, alt_b, alt_c, alt_d, alt_e } = req.body;

    const textos = { a: alt_a, b: alt_b, c: alt_c, d: alt_d, e: alt_e };
    const conteudos = [].concat(id_conteudo || []);

    if (!banca || !ano || conteudos.length === 0 || !enunciado?.trim() || !letras.includes(correta)) {
        return res.status(400).send("Preencha enunciado, banca, ano, conteúdo e a alternativa correta.");
    }
    if (!textos[correta]?.trim()) {
        return res.status(400).send("A alternativa marcada como correta precisa ser preenchida.");
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Vestibular (banca + ano)
        const [vest] = await connection.query(
            `SELECT id_vestibular FROM vestibulares WHERE banca = ? AND ano = ? LIMIT 1`,
            [banca, ano]
        );
        if (vest.length === 0) {
            await connection.rollback();
            return res.status(400).send("Não existe vestibular com essa banca e ano.");
        }

        // Imagem: só troca se enviou uma nova
        if (req.file) {
            await connection.query(
                `UPDATE questoes
                 SET id_vestibular = ?, enunciado = ?, imagem = ?
                 WHERE id_questao = ?`,
                [vest[0].id_vestibular, enunciado.trim(), req.file.buffer, idQuestao]
            );
        } else {
            await connection.query(
                `UPDATE questoes
                 SET id_vestibular = ?, enunciado = ?
                 WHERE id_questao = ?`,
                [vest[0].id_vestibular, enunciado.trim(), idQuestao]
            );
        }

        // Alternativas: atualiza / insere / remove, por posição
        const [existentes] = await connection.query(
            `SELECT id_alternativas FROM alternativas
             WHERE questoes_id_questao = ?
             ORDER BY id_alternativas`,
            [idQuestao]
        );

        let idCorreta = null;
        const remover = [];

        for (let i = 0; i < letras.length; i++) {
            const letra = letras[i];
            const texto = textos[letra]?.trim();
            const atual = existentes[i];

            if (texto && atual) {
                // já existe: atualiza o texto
                await connection.query(
                    `UPDATE alternativas SET texto = ? WHERE id_alternativas = ?`,
                    [texto, atual.id_alternativas]
                );
                if (letra === correta) idCorreta = atual.id_alternativas;

            } else if (texto && !atual) {
                // não existia: insere
                const [alt] = await connection.query(
                    `INSERT INTO alternativas (questoes_id_questao, texto) VALUES (?, ?)`,
                    [idQuestao, texto]
                );
                if (letra === correta) idCorreta = alt.insertId;

            } else if (!texto && atual) {
                // foi esvaziada: remove depois
                remover.push(atual.id_alternativas);
            }
        }

        // Troca a correta ANTES de apagar (evita problema de FK)
        await connection.query(
            `UPDATE questoes SET id_alternativa_correta = ? WHERE id_questao = ?`,
            [idCorreta, idQuestao]
        );

        for (const idAlt of remover) {
            await connection.query(
                `DELETE FROM alternativas WHERE id_alternativas = ?`,
                [idAlt]
            );
        }

        // Conteúdos: apaga e reinsere
        await connection.query(
            `DELETE FROM questoes_conteudos WHERE id_questao = ?`,
            [idQuestao]
        );
        for (const c of conteudos) {
            await connection.query(
                `INSERT INTO questoes_conteudos (id_questao, id_conteudo) VALUES (?, ?)`,
                [idQuestao, c]
            );
        }

        await connection.commit();
        res.redirect(`/alterar-questoes/${idQuestao}?sucesso=1`);
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).send("Erro ao alterar questão.");
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
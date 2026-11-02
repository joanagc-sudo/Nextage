
const express = require("express");
const multer = require("multer");

const db = require("../database");

const router = express.Router();

// armazena a imagem na memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // limite de 10 mb
});


// abre a página de cadastro de questões
router.get("/cadastro-questoes", function (req, res) {

    // verifica se o usuário é administrador
    const ehAdministrador =
        req.session.admin ||
        (req.session.usuario && Number(req.session.usuario.tipo_usuario) === 1);

    // impede o acesso de outros usuários
    if (!ehAdministrador) {
        return res.redirect(
            "/tela-inicial?error=Acesso permitido apenas para administradores."
        );
    }

    // carrega a página de cadastro
    res.render("indexCadastroQuestoes", {
        layout: "layouts/mainAdmin",
        query: req.query,
        admin: req.session.admin || req.session.usuario
    });

});


// fornece os dados para os filtros
router.get("/api/filtros", async (req, res) => {
    try {

        // busca as disciplinas
        const [disciplinas] = await db.query(
            `SELECT id_disciplina AS id, nome
             FROM disciplinas
             ORDER BY nome`
        );

        // busca os conteúdos e suas disciplinas
        const [conteudos] = await db.query(
            `SELECT id_conteudo AS id, nome, id_disciplina
             FROM conteudos
             ORDER BY nome`
        );

        // busca as bancas disponíveis
        const [bancas] = await db.query(
            `SELECT DISTINCT banca AS id, banca AS nome
             FROM vestibulares
             ORDER BY banca`
        );

        // busca os anos e suas respectivas bancas
        const [anosRows] = await db.query(
            `SELECT ano AS id, ano AS nome,
                    GROUP_CONCAT(DISTINCT banca SEPARATOR '||') AS bancas
             FROM vestibulares
             GROUP BY ano
             ORDER BY ano DESC`
        );

        // transforma as bancas em uma lista
        const anos = anosRows.map(a => ({
            ...a,
            bancas: a.bancas ? a.bancas.split("||") : []
        }));

        // envia os dados dos filtros
        res.json({ disciplinas, conteudos, bancas, anos });

    } catch (err) {

        // exibe o erro no terminal
        console.error(err);

        // retorna uma mensagem de erro
        res.status(500).json({ erro: "Erro ao buscar filtros" });
    }
});


// cadastra uma nova questão
router.post("/cadastro-questoes", upload.single("imagem"), async (req, res) => {

    // recebe os dados do formulário
    const {
        banca,
        ano,
        id_conteudo,
        enunciado,
        correta,
        alt_a,
        alt_b,
        alt_c,
        alt_d,
        alt_e
    } = req.body;

    // organiza as alternativas
    const letras = ["a", "b", "c", "d", "e"];
    const textos = {
        a: alt_a,
        b: alt_b,
        c: alt_c,
        d: alt_d,
        e: alt_e
    };

    // garante que os conteúdos sejam uma lista
    const conteudos = [].concat(id_conteudo || []);

    // verifica os campos obrigatórios
    if (!banca || !ano || conteudos.length === 0 ||
        !enunciado?.trim() || !letras.includes(correta)) {

        return res.redirect(
            "/cadastro-questoes?error=Preencha enunciado, banca, ano, conteúdo e a alternativa correta."
        );
    }

    // verifica se a alternativa correta foi preenchida
    if (!textos[correta] || !textos[correta].trim()) {
        return res.status(400).send(
            "A alternativa marcada como correta precisa ser preenchida."
        );
    }

    // obtém a imagem enviada
    const imagem = req.file ? req.file.buffer : null;

    let connection;

    try {

        // inicia a transação
        connection = await db.getConnection();
        await connection.beginTransaction();

        // busca o vestibular pela banca e pelo ano
        const [vest] = await connection.query(
            `SELECT id_vestibular
             FROM vestibulares
             WHERE banca = ? AND ano = ?
             LIMIT 1`,
            [banca, ano]
        );

        // verifica se o vestibular existe
        if (vest.length === 0) {
            await connection.rollback();
            return res.status(400).send(
                "Não existe vestibular com essa banca e ano."
            );
        }

        // obtém o id do vestibular
        const id_vestibular = vest[0].id_vestibular;

        // cadastra a questão
        const [q] = await connection.query(
            `INSERT INTO questoes
             (id_vestibular, id_alternativa_correta, enunciado, imagem)
             VALUES (?, 0, ?, ?)`,
            [id_vestibular, enunciado.trim(), imagem]
        );

        // obtém o id gerado para a questão
        const idQuestao = q.insertId;

        // cadastra somente as alternativas preenchidas
        let idCorreta = null;

        for (const letra of letras) {

            const texto = textos[letra]?.trim();

            // ignora alternativas vazias
            if (!texto) continue;

            const [alt] = await connection.query(
                `INSERT INTO alternativas
                 (questoes_id_questao, texto)
                 VALUES (?, ?)`,
                [idQuestao, texto]
            );

            // guarda o id da alternativa correta
            if (letra === correta) idCorreta = alt.insertId;
        }

        // atualiza a alternativa correta da questão
        await connection.query(
            `UPDATE questoes
             SET id_alternativa_correta = ?
             WHERE id_questao = ?`,
            [idCorreta, idQuestao]
        );

        // relaciona a questão aos conteúdos selecionados
        for (const c of conteudos) {
            await connection.query(
                `INSERT INTO questoes_conteudos
                 (id_questao, id_conteudo)
                 VALUES (?, ?)`,
                [idQuestao, c]
            );
        }

        // confirma o cadastro
        await connection.commit();

        return res.redirect(
            "/cadastro-questoes?success=Questão cadastrada com sucesso!"
        );

    } catch (err) {

        // desfaz o cadastro em caso de erro
        if (connection) await connection.rollback();

        // exibe o erro no terminal
        console.error(err);

        // retorna uma mensagem de erro
        return res.redirect(
            "/cadastro-questoes?error=Erro ao cadastrar questão!"
        );

    } finally {

        // libera a conexão com o banco
        if (connection) connection.release();
    }
});


// exporta as rotas
module.exports = router;

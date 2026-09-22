const http = require("http");
const express = require("express");
const path = require("path");
const hbs = require('hbs');
const bcrypt = require("bcrypt");

const conn = require('./database');

const app = express();

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

hbs.registerPartials('./views/partials');

app.get("/", function (req, res) {
    res.render("indexCadastroAluno", { layout: "/layouts/simples", query: req.query });
});

app.post('/', async (req, res) => {
    try {
        console.log(req.body)
        const { nome, email, senha, confirmarSenha, dataNascimento } = req.body;
        const tipo_usuario = 1; //todo

        if (!nome || !email || !senha || !confirmarSenha) {
            res.redirect("/?error=Preencha todos os campos obrigatórios.");
            // return res.status(400).json({
            //     mensagem: 'Preencha todos os campos obrigatórios.'
            // });
        }
        // Verifica se as senhas são iguais
        if (senha !== confirmarSenha) {
            res.redirect("/?error=As senhas não coincidem.");
            // return res.status(400).json({
            //     mensagem: 'As senhas não coincidem.'
            // });
        }

        // Verifica se o email já está cadastrado
        const [usuarioExistente] = await conn.query(
            'SELECT id_usuario FROM Usuarios_Administradores_Estudantes WHERE email = ?',
            [email]
        );
        if (usuarioExistente.length > 0) {
            res.redirect("/?error=Este e-mail já está cadastrado.");
            // return res.status(409).json({
            //     mensagem: 'Este e-mail já está cadastrado.'
            // });
        }

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const [resultado] = await conn.query(
            'INSERT INTO Usuarios_Administradores_Estudantes (nome, email, senha, data_nascimento, tipo_usuario) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaCriptografada, dataNascimento, tipo_usuario]
        );

        // res.status(201).json({
        //     id: resultado.insertId,
        //     nome,
        //     email,
        //     dataNascimento,
        //     tipo_usuario
        // });

        res.redirect("/tela-inicial?success=Cadastro Realizado");

    } catch (error) {
        res.redirect("/?error=Erro ao cadastrar usuário.");
        // res.status(500).json({
        //     erro: 'Erro ao cadastrar usuário'
        // });
    }
});

app.get("/tela-inicial", async function (req, res) {
    res.render("indexTelaInicial", { layout: "/layouts/main", query: req.query });
});

app.get("/materiais", async function (req, res) {
    res.render("indexMateriais", { layout: "/layouts/main", query: req.query });
});

app.get("/tela-login", async function (req, res) {
    res.render("indexTelaLogin", { layout: "/layouts/simples", query: req.query });
});

// ---------- LISTAGEM ----------
app.get("/questoes", async function (req, res) {

    // 1) Questões + vestibular + disciplinas/conteúdos (sem o blob da imagem)
    const [questoesRows] = await conn.query(`
        SELECT
            q.id_questao,
            q.enunciado,
            (q.imagem IS NOT NULL) AS tem_imagem,
            v.nome  AS vestibular,
            v.banca,
            v.ano,
            GROUP_CONCAT(DISTINCT d.nome ORDER BY d.nome SEPARATOR ', ') AS disciplinas,
            GROUP_CONCAT(DISTINCT c.nome ORDER BY c.nome SEPARATOR ', ') AS conteudos
        FROM questoes q
        JOIN vestibulares v          ON v.id_vestibular = q.id_vestibular
        LEFT JOIN questoes_conteudos qc ON qc.id_questao = q.id_questao
        LEFT JOIN conteudos c        ON c.id_conteudo = qc.id_conteudo
        LEFT JOIN disciplinas d      ON d.id_disciplina = c.id_disciplina
        GROUP BY q.id_questao, v.id_vestibular
        ORDER BY q.id_questao
    `);

    const questoes = questoesRows.map(q => ({
        ...q,
        tem_imagem: Boolean(q.tem_imagem),
        alternativas: []
    }));

    // 2) Alternativas de todas essas questões (id_alternativa_correta NÃO é enviado)
    if (questoes.length > 0) {
        const ids = questoes.map(q => q.id_questao);

        const [alternativas] = await conn.query(
            `SELECT id_alternativas, questoes_id_questao, texto
             FROM alternativas
             WHERE questoes_id_questao IN (?)
             ORDER BY questoes_id_questao, id_alternativas`,
            [ids]
        );

        const porId = new Map(questoes.map(q => [q.id_questao, q]));

        for (const alt of alternativas) {
            const questao = porId.get(alt.questoes_id_questao);
            questao.alternativas.push({
                id_alternativas: alt.id_alternativas,
                letra: String.fromCharCode(65 + questao.alternativas.length), // A, B, C...
                texto: alt.texto
            });
        }
    }

    res.render("indexTelaQuestoes", {
        layout: "/layouts/main",
        query: req.query,
        questoes
    });
});


// ---------- IMAGEM DA QUESTÃO (BLOB) ----------
function detectarMime(buf) {
    if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
    if (buf[0] === 0xFF && buf[1] === 0xD8) return "image/jpeg";
    if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
    if (buf.slice(8, 12).toString() === "WEBP") return "image/webp";
    return "application/octet-stream";
}

app.get("/questoes/:id/imagem", async function (req, res) {
    const [[row]] = await conn.query(
        "SELECT imagem FROM questoes WHERE id_questao = ?",
        [req.params.id]
    );

    if (!row || !row.imagem) return res.sendStatus(404);

    res.set("Cache-Control", "public, max-age=86400");
    res.type(detectarMime(row.imagem)).send(row.imagem);
});


// ---------- VERIFICAR RESPOSTA ----------
app.post("/questoes/:id/responder", express.json(), async function (req, res) {
    const idQuestao = Number(req.params.id);
    const idAlternativa = Number(req.body.id_alternativa);

    const [[questao]] = await conn.query(
        "SELECT id_alternativa_correta, explicacao FROM questoes WHERE id_questao = ?",
        [idQuestao]
    );

    if (!questao) return res.status(404).json({ erro: "Questão não encontrada" });

    const acertou = questao.id_alternativa_correta === idAlternativa;

    // Registra em `responder` (adapte para como você guarda o usuário logado)
    const idUsuario = req.session?.id_usuario;

    if (idUsuario) {
        await conn.query(
            `INSERT INTO responder (id_usuario, id_questao, data, certo)
             VALUES (?, ?, CURDATE(), ?)
             ON DUPLICATE KEY UPDATE data = CURDATE(), certo = ?`,
            [idUsuario, idQuestao, acertou ? 1 : 0, acertou ? 1 : 0]
        );
    }

    res.json({
        acertou,
        id_correta: questao.id_alternativa_correta,
        explicacao: questao.explicacao
    });
});

http.createServer(app).listen(8080, () => {
    console.log("Servidor inicializado. http://localhost:8080/");
});
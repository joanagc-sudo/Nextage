const http = require("http");
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const conn = require("./database");
const app = express();

app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "nextage123",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 30
        }
    })
);

app.use((req, res, next) => {
res.locals.usuario = req.session.usuario || null;
next();
});

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/imagens/perfis");
    },
    filename: function (req, file, cb) {
        const nomeArquivo = Date.now() + "-" + file.originalname;
        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
});

hbs.registerPartials("./views/partials");

app.get("/", function (req, res) {

    res.render("indexCadastroAluno", {
        layout: "/layouts/simples",
        query: req.query
    });

});

app.post("/", async (req, res) => {
    try {
        console.log(req.body);
        const {
            nome,
            email,
            senha,
            confirmarSenha,
            dataNascimento
        } = req.body;

        const tipo_usuario = 1;

        if (!nome || !email || !senha || !confirmarSenha) {
            return res.redirect(
                "/?error=Preencha todos os campos obrigatórios."
            );
        }

        if (senha !== confirmarSenha) {
            return res.redirect(
            "/?error=As senhas não coincidem."
            );
        }

        const [usuarioExistente] = await conn.query(
            `
            SELECT id_usuario
            FROM Usuarios_Administradores_Estudantes
            WHERE email = ?
            `,
            [email]
        );

        if (usuarioExistente.length > 0) {

            return res.redirect(
                "/?error=Este e-mail já está cadastrado."
            );

        }

        // Criptografa a senha

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        // Cadastra o usuário

    const [resultado] = await conn.query(
    `
    INSERT INTO Usuarios_Administradores_Estudantes
    (
        nome,
        email,
        senha,
        data_nascimento,
        tipo_usuario
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
        nome,
        email,
        senhaCriptografada,
        dataNascimento,
        tipo_usuario
    ]
);

    console.log(
    "Usuário cadastrado:",
    resultado.insertId
);

    req.session.usuario = {
    id: resultado.insertId,
    nome: nome,
    email: email,
    foto: null
};

    console.log(
    "Usuário salvo na sessão:",
    req.session.usuario
);

    return res.redirect(
    "/tela-inicial?success=Cadastro Realizado"
);

    } catch (error) {

    console.error("Erro ao cadastrar usuário:", error);

    return res.redirect("/?error=Erro ao cadastrar usuário.");
    }

});

app.get("/tela-inicial", async function (req, res) {

    res.render("indexTelaInicial", {
        layout: "/layouts/main",
        query: req.query
    });

});

app.get("/materiais", async function (req, res) {

    res.render("indexMateriais", {
        layout: "/layouts/main",
        query: req.query
    });

});

app.get("/disciplinas", function (req, res) {

    res.render("indexDisciplinas", {
        layout: "/layouts/main",
        query: req.query
    });

});


app.get("/tela-login", async function (req, res) {

    res.render("indexTelaLogin", {
        layout: "/layouts/simples",
        query: req.query
    });

});

app.post("/login", async function (req, res) {
    try {

        const { email, senha } = req.body;

        // Verifica se os campos foram preenchidos
        if (!email || !senha) {
            return res.redirect(
                "/tela-login?error=Informe o e-mail e a senha."
            );
        }

        // Procura o usuário no banco
        const [usuarios] = await conn.query(
            `
            SELECT
                id_usuario,
                nome,
                email,
                senha,
                foto,
                tipo_usuario
            FROM Usuarios_Administradores_Estudantes
            WHERE email = ?
            `,
            [email]
        );

        // Se não encontrou o usuário
        if (usuarios.length === 0) {
            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );
        }

        const usuario = usuarios[0];

        // Confere a senha
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        // Se a senha estiver errada
        if (!senhaCorreta) {
            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );
        }

        // SALVA O USUÁRIO NA SESSÃO
        req.session.usuario = {
            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            foto: usuario.foto
        };

        console.log("Login realizado:", usuario.email);
        console.log("Usuário salvo na sessão:", req.session.usuario);

        // Vai para a tela inicial
        return res.redirect("/tela-inicial");

    } catch (error) {

        console.error("Erro ao realizar login:", error);

        return res.redirect(
            "/tela-login?error=Erro ao realizar login."
        );
    }
});

app.post("/alterar-foto", upload.single("foto"), async (req, res) => {
    try {

        console.log("alterarfoto");
        console.log("Usuário da sessão:", req.session.usuario);
        console.log("Arquivo recebido:", req.file);

        if (!req.session.usuario) {
            console.log("ERRO: usuário não está logado.");

            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        if (!req.file) {
            console.log("ERRO: nenhum arquivo recebido.");

            return res.status(400).json({
                erro: "Nenhuma foto foi enviada."
            });
        }

        const foto = "/imagens/perfis/" + req.file.filename;
        const idUsuario = req.session.usuario.id;

        console.log("ID do usuário:", idUsuario);
        console.log("Caminho da foto:", foto);

        await conn.query(
            `UPDATE Usuarios_Administradores_Estudantes
             SET foto = ?
             WHERE id_usuario = ?`,
            [foto, idUsuario]
        );

        req.session.usuario.foto = foto;

        console.log("foto salva com sucesso!");

        return res.json({
            sucesso: true,
            foto: foto
        });

    } catch (error) {

        console.error("erro ao alterar a foto");
        console.error(error);

        return res.status(500).json({
            erro: error.message
        });
    }
});



app.get("/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error(
                "Erro ao sair:",
                erro
            );
        }

        res.redirect("/");

    });

});

app.get("/questoes", async function (req, res) {

    // 1) Questões + vestibular + disciplinas/conteúdos

    const [questoesRows] = await conn.query(`
        SELECT
            q.id_questao,
            q.enunciado,
            (q.imagem IS NOT NULL) AS tem_imagem,
            v.nome AS vestibular,
            v.banca,
            v.ano,
            GROUP_CONCAT(
                DISTINCT d.nome
                ORDER BY d.nome
                SEPARATOR ', '
            ) AS disciplinas,
            GROUP_CONCAT(
                DISTINCT c.nome
                ORDER BY c.nome
                SEPARATOR ', '
            ) AS conteudos

        FROM questoes q

        JOIN vestibulares v
            ON v.id_vestibular = q.id_vestibular

        LEFT JOIN questoes_conteudos qc
            ON qc.id_questao = q.id_questao

        LEFT JOIN conteudos c
            ON c.id_conteudo = qc.id_conteudo

        LEFT JOIN disciplinas d
            ON d.id_disciplina = c.id_disciplina

        GROUP BY
            q.id_questao,
            q.enunciado,
            q.imagem,
            v.id_vestibular,
            v.nome,
            v.banca,
            v.ano

        ORDER BY q.id_questao
    `);


    const questoes = questoesRows.map(q => ({

        ...q,

        tem_imagem: Boolean(q.tem_imagem),

        alternativas: []

    }));

    // 2) Alternativas

    if (questoes.length > 0) {

        const ids =
            questoes.map(q => q.id_questao);


        const [alternativas] = await conn.query(
            `
            SELECT
                id_alternativas,
                questoes_id_questao,
                texto

            FROM alternativas

            WHERE questoes_id_questao IN (?)

            ORDER BY
                questoes_id_questao,
                id_alternativas
            `,
            [ids]
        );


        const porId = new Map(
            questoes.map(
                q => [q.id_questao, q]
            )
        );


        for (const alt of alternativas) {

            const questao =
                porId.get(
                    alt.questoes_id_questao
                );


            questao.alternativas.push({

                id_alternativas:
                    alt.id_alternativas,

                letra:
                    String.fromCharCode(
                        65 +
                        questao.alternativas.length
                    ),

                texto:
                    alt.texto

            });

        }

    }


    res.render(
        "indexTelaQuestoes",
        {

            layout: "/layouts/main",

            query: req.query,

            questoes

        }
    );

});



function detectarMime(buf) {

    if (
        buf[0] === 0x89 &&
        buf[1] === 0x50
    ) {
        return "image/png";
    }


    if (
        buf[0] === 0xFF &&
        buf[1] === 0xD8
    ) {
        return "image/jpeg";
    }


    if (
        buf[0] === 0x47 &&
        buf[1] === 0x49
    ) {
        return "image/gif";
    }


    if (
        buf.slice(8, 12).toString() === "WEBP"
    ) {
        return "image/webp";
    }


    return "application/octet-stream";

}


app.get(
    "/questoes/:id/imagem",
    async function (req, res) {

        const [[row]] = await conn.query(
            `
            SELECT imagem
            FROM questoes
            WHERE id_questao = ?
            `,
            [req.params.id]
        );


        if (
            !row ||
            !row.imagem
        ) {

            return res.sendStatus(404);

        }


        res.set(
            "Cache-Control",
            "public, max-age=86400"
        );


        res
            .type(detectarMime(row.imagem))
            .send(row.imagem);

    }
);



app.post(
    "/questoes/:id/responder",
    express.json(),
    async function (req, res) {

        const idQuestao =
            Number(req.params.id);

        const idAlternativa =
            Number(req.body.id_alternativa);


        const [[questao]] =
            await conn.query(
                `
                SELECT
                    id_alternativa_correta,
                    explicacao

                FROM questoes

                WHERE id_questao = ?
                `,
                [idQuestao]
            );


        if (!questao) {

            return res.status(404).json({
                erro: "Questão não encontrada"
            });

        }


        const acertou =
            questao.id_alternativa_correta ===
            idAlternativa;


        // Pega o ID do usuário logado

        const idUsuario =
            req.session?.usuario?.id;


        if (idUsuario) {

            await conn.query(
                `
                INSERT INTO responder
                (
                    id_usuario,
                    id_questao,
                    data,
                    certo
                )

                VALUES
                (
                    ?,
                    ?,
                    CURDATE(),
                    ?
                )

                ON DUPLICATE KEY UPDATE
                    data = CURDATE(),
                    certo = ?
                `,
                [
                    idUsuario,
                    idQuestao,
                    acertou ? 1 : 0,
                    acertou ? 1 : 0
                ]
            );

        }


        res.json({

            acertou,

            id_correta:
                questao.id_alternativa_correta,

            explicacao:
                questao.explicacao

        });

    }
);

http.createServer(app).listen(8080, () => {

    console.log(
        "Servidor inicializado. http://localhost:8080/"
    );

});
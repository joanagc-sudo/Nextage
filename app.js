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
    res.render("indexTelaLogin", { layout: "/layouts/main", query: req.query });

app.post("/login", async function (req, res) {

    try {const { email, senha } = req.body;
        if (!email || !senha) {
            return res.redirect(
                "/tela-login?error=Informe o e-mail e a senha."
            );
        }
        const [usuarios] = await conn.query(
            `
            SELECT
                id_usuario,
                nome,
                email,
                senha,
                tipo_usuario
            FROM Usuarios_Administradores_Estudantes
            WHERE email = ?
            `,
            [email]
        );

        if (usuarios.length === 0) {

            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );

        }


        const usuario = usuarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {

            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );

        }

        console.log("Login realizado:", usuario.email);

        return res.redirect("/tela-inicial");

    } catch (error) {

        console.error("Erro ao realizar login:", error);

        return res.redirect("/tela-login?error=Erro ao realizar login.");
    }

});

});

app.get("/questoes", async function (req, res) {

    const [result] = await conn.query(
            `SELECT * FROM questoes 
            JOIN vestibulares ON questoes.id_vestibular = vestibulares.id_vestibular
            JOIN alternativas ON questoes.id_questao = alternativas.questoes_id_questao`
        );
    
    //console.log(result);

    res.render("indexTelaQuestoes", { layout: "/layouts/main", query: req.query, result: result });
});

http.createServer(app).listen(8080, () => {
    console.log("Servidor inicializado. http://localhost:8080/");
});
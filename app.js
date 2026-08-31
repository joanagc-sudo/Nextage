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

app.get("/", function(req, res) {
    res.render("indexCadastroAluno", { layout: "/layouts/simples"});
});

app.post('/', async (req, res) => {
    try {
        console.log(req.body)
        const { nome, email, senha, confirmarSenha, dataNascimento } = req.body;
        const tipo_usuario = 1; //todo

         if (!nome || !email || !senha || !confirmarSenha) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }
        // Verifica se as senhas são iguais
        if (senha !== confirmarSenha) {
            return res.status(400).json({
                mensagem: 'As senhas não coincidem.'
            });
        }
         // Verifica se o email já está cadastrado
        const [usuarioExistente] = await conn.query(
    'SELECT id_usuario FROM Usuarios_Administradores_Estudantes WHERE email = ?',
    [email]
);

if (usuarioExistente.length > 0) {
    return res.status(409).json({
        mensagem: 'Este e-mail já está cadastrado.'
    });
}

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);


        const [resultado] = await conn.query(
            'INSERT INTO Usuarios_Administradores_Estudantes (nome, email, senha, data_nascimento, tipo_usuario) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaCriptografada, dataNascimento, tipo_usuario]
        );

        res.status(201).json({
            id: resultado.insertId,
            nome,
            email, 
            dataNascimento,
            tipo_usuario
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: 'Erro ao cadastrar usuário'
        });
    }
});

app.get("/tela-inicial", function(req, res) {
    res.render("indexTelaInicial", { layout: "/layouts/main"});
});

app.get("/materiais", function(req, res) {
    res.render("indexMateriais", { layout: "/layouts/main"});
});

app.get("/login", function(req, res) {
    res.render("indexTelaLogin", { layout: "/layouts/main"});
});

app.get("/questoes", function(req, res) {
    res.render("indexTelaQuestoes", { layout: "/layouts/main"});
});

http.createServer(app).listen(8080, () => {
    console.log("Servidor inicializado. http://localhost:8080/");
});
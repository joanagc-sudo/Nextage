
    const http = require("http");
    const express = require("express");
    const path = require("path");
    const hbs = require("hbs");
    const session = require("express-session");

    const app = express();

    //logins
    const { exigirLogin, exigirAdmin } = require("./autenticacao");

    // Importação das rotas
    const cadastroRoutes = require("./routes/rotaCadastro");
    const loginRoutes = require("./routes/rotaLogin");
    const usuarioRoutes = require("./routes/rotaUsuario");
    const paginasRoutes = require("./routes/rotaPaginas");
    const questoesRoutes = require("./routes/rotaQuestoes");
    const filtrosRoutes = require("./routes/rotaFiltros");
    const cronogramasRoutes = require("./routes/rotaCronogramas");
    const materiaisRoutes = require("./routes/rotaMateriais");
    const cadastroQuestoesRoutes = require("./routes/rotaCadastroQuestoes");
    const lembretesRoutes = require("./routes/rotaLembretes");
    const cronometroRoutes = require("./routes/rotaCronometro");
    const adminRoutes = require("./routes/rotaAdmin");
    const alterarQuestoesRoutes = require("./routes/rotaAlterarQuestoes");
    const desempenhoRoutes = require("./routes/rotaDesempenho");
    const excluirQuestaoRoutes = require("./routes/rotaExcluirQuestao");
    const atualizarUsuarioRoutes = require("./routes/rotaAtualizarUsuario");
    const flashcardsRoutes = require("./routes/rotaFlashcards");
    const flashcardsEstudanteRoutes = require("./routes/rotaFlashcardsEstudante");
    const gerenciarUsuariosRoutes = require("./routes/rotaGerenciarUsuarios");


    // Configuração do Handlebars
    app.set("view engine", "hbs");

    // Helper para formatar a data de nascimento
    hbs.registerHelper("formatDate", function(data) {

        if (!data) return "";

        const dataFormatada = new Date(data);

        return dataFormatada.toISOString().split("T")[0];

    });

    // Arquivos estáticos (CSS, JS, imagens)
    app.use(
        express.static(
            path.join(__dirname, "public")
        )
    );

    // Leitura de dados enviados pelos formulários
    app.use(express.json());

    app.use(
        express.urlencoded({
            extended: true
        })
    );

    // Configuração das sessões
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

    // Disponibilizar informações do usuário
    // e do administrador para as páginas
    app.use((req, res, next) => {

        const usuario = req.session.usuario || null;
        const admin = req.session.admin || null;

        res.locals.usuario = usuario;
        res.locals.admin = admin;

        res.locals.ehAdministrador =
            Boolean(admin) ||
            (usuario && Number(usuario.tipo_usuario) === 1);

        next();

    });

    // Configuração dos arquivos parciais do Handlebars
    hbs.registerPartials(
        path.join(__dirname, "views/partials")
    );


    // rotas publicas (NÃO EXIGEM LOGIN)

    app.use("/", cadastroRoutes);
    app.use("/", loginRoutes);

    // rotas que exigem login

    app.use("/", exigirLogin, usuarioRoutes);
    app.use("/", exigirLogin, paginasRoutes);
    app.use("/", exigirLogin, questoesRoutes);
    app.use("/", exigirLogin, filtrosRoutes);
    app.use("/", exigirLogin, cronogramasRoutes);
    app.use("/", exigirLogin, materiaisRoutes);
    app.use("/", exigirLogin, lembretesRoutes);
    app.use("/", exigirLogin, cronometroRoutes);
    app.use("/", exigirLogin, desempenhoRoutes);
    app.use("/", exigirLogin, atualizarUsuarioRoutes);
    app.use("/", exigirLogin, flashcardsEstudanteRoutes);

    // rotas que exigem admin

    app.use("/", exigirAdmin, adminRoutes);
    app.use("/", exigirAdmin, gerenciarUsuariosRoutes);
    app.use("/", exigirAdmin, cadastroQuestoesRoutes);
    app.use("/", exigirAdmin, alterarQuestoesRoutes);
    app.use("/", exigirAdmin, excluirQuestaoRoutes);
    app.use("/", exigirAdmin, flashcardsRoutes);

    // Inicialização do servidor
    http.createServer(app).listen(8080, () => {

        console.log(
            "Servidor inicializado. http://localhost:8080/"
        );

    });

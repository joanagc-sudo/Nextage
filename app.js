
const http = require("http");
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const session = require("express-session");

const app = express();

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

// Configuração do Handlebars
app.set("view engine", "hbs");

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

// Registro das rotas
app.use("/", cadastroRoutes);
app.use("/", loginRoutes);
app.use("/", usuarioRoutes);
app.use("/", paginasRoutes);
app.use("/", questoesRoutes);
app.use("/", filtrosRoutes);
app.use("/", cronogramasRoutes);
app.use("/materiais", materiaisRoutes);
app.use("/", cadastroQuestoesRoutes);

app.use("/" ,lembretesRoutes);
app.use("/" ,cronometroRoutes);
app.use("/" ,adminRoutes);
app.use("/" ,alterarQuestoesRoutes);
app.use("/" ,desempenhoRoutes);
app.use("/", lembretesRoutes);
app.use("/", cronometroRoutes);
app.use("/", adminRoutes);
app.use("/", alterarQuestoesRoutes);
app.use("/", excluirQuestaoRoutes);
// Inicialização do servidor
http.createServer(app).listen(8080, () => {

    console.log(
        "Servidor inicializado. http://localhost:8080/"
    );

});

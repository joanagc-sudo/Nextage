const http = require("http");
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const session = require("express-session");

const app = express();

const cadastroRoutes = require("./routes/rotaCadastro");
const loginRoutes = require("./routes/rotaLogin");
const usuarioRoutes = require("./routes/rotaUsuario");
const paginasRoutes = require("./routes/rotaPaginas");
const questoesRoutes = require("./routes/rotaQuestoes");
const filtrosRoutes = require("./routes/rotaFiltros");
const filtrosRoutes = require("./routes/rotaCronogramas");

app.set("view engine", "hbs");

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


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


// Usuário disponível nas views
app.use((req, res, next) => {

    res.locals.usuario =
        req.session.usuario || null;

    next();

});


hbs.registerPartials("./views/partials");

// ROTAS
console.log("cadastroRoutes:", typeof cadastroRoutes);
console.log("loginRoutes:", typeof loginRoutes);
console.log("usuarioRoutes:", typeof usuarioRoutes);
console.log("paginasRoutes:", typeof paginasRoutes);
console.log("questoesRoutes:", typeof questoesRoutes);
console.log("filtrosRoutes:", typeof filtrosRoutes);

app.use("/", cadastroRoutes);
app.use("/", loginRoutes);
app.use("/", usuarioRoutes);
app.use("/", paginasRoutes);
app.use("/", questoesRoutes);
app.use("/", filtrosRoutes);


http.createServer(app).listen(8080, () => {

    console.log(
        "Servidor inicializado. http://localhost:8080/"
    );

});

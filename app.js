const http = require("http");
const express = require("express");
const path = require("path");
const hbs = require('hbs');

const app = express();

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, "public")));

hbs.registerPartials('./views/partials');

app.get("/", function(req, res) {
    res.render("indexCadastroAluno", { layout: "/layouts/simples"});
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
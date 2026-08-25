const http = require("http");
const express = require("express");
const path = require("path");

const app = express();

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "public", "indexCadastroAluno.html"));
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "public", "indexTelaInicial.html"));
});

app.get("/tela-inicial", function(req, res) {
    res.render("indexTelaInicial");
});

app.get("/materiais", function(req, res) {
    res.render("indexMateriais");
});

app.get("/login", function(req, res) {
    res.render("indexTelaLogin");
});

http.createServer(app).listen(8080, () => {
    console.log("Servidor inicializado. http://localhost:8080/");
});
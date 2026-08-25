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

app.get("/telainicial", function(req, res) {
    res.render("indexTelaInicial");
});

http.createServer(app).listen(8080, () => {
    console.log("Servidor rodando na porta 8080");
});
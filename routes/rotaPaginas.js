const express = require("express");

const router = express.Router();

router.get("/teste", (req, res) => {
    res.send("ROTA FUNCIONANDO!");
});

router.get("/tela-inicial", async function (req, res) {

    res.render("indexTelaInicial", {
        layout: "/layouts/main",
        query: req.query
    });

});

router.get("/materiais", async function (req, res) {

    res.render("indexMateriais", {
        layout: "/layouts/main",
        query: req.query
    });

});

router.get("/disciplinas", function (req, res) {

    res.render("indexDisciplinas", {
        layout: "/layouts/main",
        query: req.query
    });

});

module.exports = router;

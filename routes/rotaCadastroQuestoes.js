const express = require("express");
const multer = require("multer");

const conn = require("../database");

const router = express.Router();

router.get("/cadastro-questoes", function (req, res) {
    res.render("indexCadastroQuestoes", {
        layout: "/layouts/main",
        query: req.query
    });
});

module.exports = router;
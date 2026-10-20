//rooota

const express = require("express");
const bcrypt = require("bcrypt");

const conn = require("../database");

const router = express.Router();

router.get("/cronometro", function (req, res) {

    res.render("indexCronometro", {
        layout: "/layouts/simples",query: req.query});
});
module.exports = router;
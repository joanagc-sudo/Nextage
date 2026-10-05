const express = require("express");
const multer = require("multer");

const conn = require("../database");

const router = express.Router();

router.get("/cronograma", function (req, res) {
    res.render("indexCronograma", {
        layout: "/layouts/main",
        query: req.query
    });
});

module.exports = router;
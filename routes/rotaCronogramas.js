const express = require("express");

const router = express.Router();

router.get("/cronograma", function (req, res) {

    res.render("indexCronograma", {
        layout: "/layouts/main",
        query: req.query
    });

});

module.exports = router;
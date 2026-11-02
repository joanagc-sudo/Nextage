const express = require("express");
const router = express.Router();

router.get("/flashcards", (req, res) => {
    res.send("Página de flashcards funcionando!");
});

module.exports = router;
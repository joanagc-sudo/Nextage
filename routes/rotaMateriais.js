const express = require("express");
const router = express.Router();
const conn = require("../database");
const multer = require("multer");

// CONFIG UPLOAD
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/imagens/materiais");
    },
    filename: function (req, file, cb) {
        const nomeArquivo = Date.now() + "-" + file.originalname;
        cb(null, nomeArquivo);
    }
});

const upload = multer({ storage });

/* SALVAR MATERIAL */
router.post("/", upload.single("arquivo"), async (req, res) => {
    try {
        const titulo = req.body.titulo;
        const descricao = req.body.descricao;
        const arquivo = req.file.filename;

        const idUsuario = req.session.usuario.id;

        await conn.query(`
            INSERT INTO materiais
            (id_usuario, titulo, material_arquivo, data_publicacao, autor, aprovado_publicacao, descricao)
            VALUES (?, ?, ?, CURDATE(), ?, 1, ?)
        `, [
            idUsuario,
            titulo,
            arquivo,
            req.session.usuario.nome,
            descricao
        ]);

        return res.json({ sucesso: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao salvar material" });
    }
});

/* BUSCAR MATERIAIS */
router.get("/", async (req, res) => {
    try {
        const [materiais] = await conn.query(`
            SELECT 
                id_material,
                titulo,
                descricao,
                material_arquivo,
                autor,
                data_publicacao
            FROM materiais
            ORDER BY id_material DESC
        `);

        return res.json(materiais);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao buscar materiais" });
    }
});

module.exports = router;
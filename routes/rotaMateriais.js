
const express = require("express");
const router = express.Router();
const conn = require("../database");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// garante que a pasta de materiais exista
const pastaMateriais = path.join(
    __dirname,
    "..",
    "public",
    "imagens",
    "materiais"
);

if (!fs.existsSync(pastaMateriais)) {
    fs.mkdirSync(pastaMateriais, { recursive: true });
}

// define onde os arquivos enviados serão armazenados
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pastaMateriais);
    },

    filename: function (req, file, cb) {
        const nomeArquivo = Date.now() + "-" + file.originalname;
        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
});

// cadastra um novo material
router.post("/", upload.single("arquivo"), async (req, res) => {
    let arquivoSalvo = null;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                erro: "Nenhum arquivo foi enviado."
            });
        }

        const titulo = req.body.titulo;
        const descricao = req.body.descricao;
        const arquivo = req.file.filename;

        arquivoSalvo = arquivo;

        const idUsuario = req.session.usuario.id;

        await conn.query(`
            INSERT INTO materiais (
                id_usuario,
                titulo,
                material_arquivo,
                data_publicacao,
                autor,
                aprovado_publicacao,
                descricao
            )
            VALUES (?, ?, ?, CURDATE(), ?, 1, ?)
        `, [
            idUsuario,
            titulo,
            arquivo,
            req.session.usuario.nome,
            descricao
        ]);

        return res.json({
            sucesso: true
        });

    } catch (error) {
        console.error("Erro ao salvar material:", error);

        // remove o arquivo caso o cadastro no banco não seja concluído
        if (arquivoSalvo) {
            const caminhoArquivo = path.join(pastaMateriais, arquivoSalvo);

            fs.unlink(caminhoArquivo, function (erro) {
                if (erro && erro.code !== "ENOENT") {
                    console.error("Erro ao remover arquivo:", erro);
                }
            });
        }

        return res.status(500).json({
            erro: "Erro ao salvar material."
        });
    }
});

// busca os materiais compartilhados de um assunto
router.get("/assunto/:materia", async (req, res) => {
    try {
        const materia = req.params.materia;

        const [materiais] = await conn.query(`
            SELECT
                id_material,
                titulo,
                descricao,
                material_arquivo,
                autor,
                data_publicacao
            FROM materiais
            WHERE descricao = ?
            AND aprovado_publicacao = 1
            ORDER BY id_material DESC
        `, [materia]);

        return res.json(materiais);

    } catch (error) {
        console.error("Erro ao buscar materiais do assunto:", error);

        return res.status(500).json({
            erro: "Não foi possível buscar os materiais."
        });
    }
});

// busca os materiais cadastrados pelo usuário logado
router.get("/lista", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.id;

        const [materiais] = await conn.query(`
            SELECT
                id_material,
                titulo,
                descricao,
                material_arquivo,
                autor,
                data_publicacao
            FROM materiais
            WHERE id_usuario = ?
            ORDER BY id_material DESC
        `, [idUsuario]);

        return res.json(materiais);

    } catch (error) {
        console.error("Erro ao buscar materiais:", error);

        return res.status(500).json({
            erro: "Erro ao buscar materiais."
        });
    }
});

// exclui um material que pertence ao usuário logado
router.delete("/:id", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idMaterial = req.params.id;
        const idUsuario = req.session.usuario.id;

        // verifica se o material pertence ao usuário
        const [materiais] = await conn.query(`
            SELECT material_arquivo
            FROM materiais
            WHERE id_material = ?
            AND id_usuario = ?
        `, [
            idMaterial,
            idUsuario
        ]);

        if (materiais.length === 0) {
            return res.status(404).json({
                erro: "Material não encontrado ou você não tem permissão para excluí-lo."
            });
        }

        const nomeArquivo = materiais[0].material_arquivo;

        // exclui o registro somente se ele pertencer ao usuário
        const [resultado] = await conn.query(`
            DELETE FROM materiais
            WHERE id_material = ?
            AND id_usuario = ?
        `, [
            idMaterial,
            idUsuario
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Não foi possível excluir o material."
            });
        }

        // remove o arquivo da pasta depois de excluir o registro
        if (nomeArquivo) {
            const caminhoArquivo = path.join(
                pastaMateriais,
                nomeArquivo
            );

            fs.unlink(caminhoArquivo, function (erro) {
                if (erro && erro.code !== "ENOENT") {
                    console.error("Erro ao excluir arquivo:", erro);
                }
            });
        }

        return res.json({
            sucesso: true
        });

    } catch (error) {
        console.error("Erro ao excluir material:", error);

        return res.status(500).json({
            erro: "Erro ao excluir material."
        });
    }
});

module.exports = router;

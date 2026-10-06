const express = require("express");
const router = express.Router();
const conn = require("../database");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// configuracao do upload

const storage = multer.diskStorage({


destination: function (req, file, cb) {

    cb(
        null,
        "public/imagens/materiais"
    );

},

filename: function (req, file, cb) {

    const nomeArquivo =
        Date.now() +
        "-" +
        file.originalname;

    cb(
        null,
        nomeArquivo
    );

}


});

const upload = multer({
storage: storage
});

// cadastro de materiais
router.post(
"/",
upload.single("arquivo"),
async (req, res) => {


    try {

        // Verifica se o usuário está logado
        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado"
            });

        }

        // Verifica se recebeu arquivo
        if (!req.file) {

            return res.status(400).json({
                erro: "Nenhum arquivo foi enviado"
            });

        }

        const titulo =
            req.body.titulo;

        const descricao =
            req.body.descricao;

        const arquivo =
            req.file.filename;


        const idUsuario =
            req.session.usuario.id;

        // Salva no banco
        await conn.query(`

            INSERT INTO materiais
            (
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

        console.error(
            "Erro ao salvar material:",
            error
        );


        return res.status(500).json({

            erro: "Erro ao salvar material"

        });

    }

}


);

// buscar materiais
router.get(
"/",
async (req, res) => {

    try {

        const [materiais] =
            await conn.query(`

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

        return res.json(
            materiais
        );

    } catch (error) {

        console.error(
            "Erro ao buscar materiais:",
            error
        );


        return res.status(500).json({

            erro: "Erro ao buscar materiais"

        });
    }
}

);

// excluir material
router.delete(
"/:id",
async (req, res) => {

    try {

        const idMaterial =
            req.params.id;

        // Primeiro procura o arquivo
        // para poder apagá-lo da pasta

        const [materiais] =
            await conn.query(`

                SELECT
                    material_arquivo

                FROM materiais

                WHERE id_material = ?

            `, [
                idMaterial
            ]);


        if (
            materiais.length === 0
        ) {

            return res.status(404).json({

                erro: "Material não encontrado"

            });

        }

        const nomeArquivo =
            materiais[0].material_arquivo;

        // Exclui o registro do banco

        await conn.query(`

            DELETE FROM materiais

            WHERE id_material = ?

        `, [
            idMaterial
        ]);

        // Exclui o arquivo da pasta

        if (nomeArquivo) {

            const caminhoArquivo =
                path.join(
                    __dirname,
                    "..",
                    "public",
                    "imagens",
                    "materiais",
                    nomeArquivo
                );

            fs.unlink(
                caminhoArquivo,
                function (erro) {

                    if (
                        erro &&
                        erro.code !== "ENOENT"
                    ) {

                        console.error(
                            "Erro ao excluir arquivo:",
                            erro
                        );

                    }

                }
            );

        }

        return res.json({

            sucesso: true

        });


    } catch (error) {

        console.error(
            "Erro ao excluir material:",
            error
        );


        return res.status(500).json({

            erro: "Erro ao excluir material"

        });

    }

}

);

module.exports = router;

const express = require("express");
const multer = require("multer");

const conn = require("../database");

const router = express.Router();


// ============================
// CONFIGURAÇÃO DA FOTO
// ============================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            "public/imagens/perfis"
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


// ============================
// ALTERAR FOTO
// ============================

router.post(
    "/alterar-foto",
    upload.single("foto"),
    async (req, res) => {

        try {

            if (!req.session.usuario) {

                return res.status(401).json({
                    erro: "Usuário não está logado."
                });

            }


            if (!req.file) {

                return res.status(400).json({
                    erro: "Nenhuma foto foi enviada."
                });

            }


            const foto =
                "/imagens/perfis/" +
                req.file.filename;


            const idUsuario =
                req.session.usuario.id;


            await conn.query(
                `
                UPDATE
                    Usuarios_Administradores_Estudantes

                SET foto = ?

                WHERE id_usuario = ?
                `,
                [
                    foto,
                    idUsuario
                ]
            );


            req.session.usuario.foto =
                foto;


            return res.json({

                sucesso: true,
                foto: foto

            });


        } catch (error) {

            console.error(
                "Erro ao alterar foto:",
                error
            );


            return res.status(500).json({
                erro: error.message
            });

        }

    }
);


// ============================
// LOGOUT
// ============================

router.get("/logout", (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {

            console.error(
                "Erro ao sair:",
                erro
            );

        }

        res.redirect("/");

    });

});


module.exports = router;

const express = require("express");
const bcrypt = require("bcrypt");

const conn = require("../database");

const router = express.Router();

router.get("/tela-login", function (req, res) {

    res.render("indexTelaLogin", {
        layout: "/layouts/simples",
        query: req.query
    });

});

router.post("/login", async function (req, res) {

    try {

        const {
            email,
            senha
        } = req.body;


        if (!email || !senha) {

            return res.redirect(
                "/tela-login?error=Informe o e-mail e a senha."
            );

        }


        const [usuarios] =
            await conn.query(
                `
                SELECT
                    id_usuario,
                    nome,
                    email,
                    senha,
                    foto,
                    tipo_usuario
                FROM Usuarios_Administradores_Estudantes
                WHERE email = ?
                `,
                [email]
            );


        if (usuarios.length === 0) {

            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );

        }


        const usuario = usuarios[0];


        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            );


        if (!senhaCorreta) {

            return res.redirect(
                "/tela-login?error=E-mail ou senha incorretos."
            );

        }


        req.session.usuario = {

            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            foto: usuario.foto

        };


        return res.redirect("/tela-inicial");


    } catch (error) {

        console.error(
            "Erro ao realizar login:",
            error
        );


        return res.redirect(
            "/tela-login?error=Erro ao realizar login."
        );

    }

});


module.exports = router;

//logout
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



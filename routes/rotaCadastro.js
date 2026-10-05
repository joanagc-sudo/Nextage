const express = require("express");
const bcrypt = require("bcrypt");

const conn = require("../database");

const router = express.Router();

router.get("/", function (req, res) {

    res.render("indexCadastroAluno", {
        layout: "/layouts/simples",
        query: req.query
    });

});

router.post("/", async (req, res) => {

    try {

        const {
            nome,
            email,
            senha,
            confirmarSenha,
            dataNascimento
        } = req.body;


        const tipo_usuario = 1;


        if (!nome || !email || !senha || !confirmarSenha) {

            return res.redirect(
                "/?error=Preencha todos os campos obrigatórios."
            );

        }


        if (senha !== confirmarSenha) {

            return res.redirect(
                "/?error=As senhas não coincidem."
            );

        }


        const [usuarioExistente] =
            await conn.query(
                `
                SELECT id_usuario
                FROM Usuarios_Administradores_Estudantes
                WHERE email = ?
                `,
                [email]
            );


        if (usuarioExistente.length > 0) {

            return res.redirect(
                "/?error=Este e-mail já está cadastrado."
            );

        }


        const senhaCriptografada =
            await bcrypt.hash(senha, 10);


        const [resultado] =
            await conn.query(
                `
                INSERT INTO
                Usuarios_Administradores_Estudantes
                (
                    nome,
                    email,
                    senha,
                    data_nascimento,
                    tipo_usuario
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    nome,
                    email,
                    senhaCriptografada,
                    dataNascimento,
                    tipo_usuario
                ]
            );


        req.session.usuario = {

            id: resultado.insertId,
            nome: nome,
            email: email,
            foto: null

        };


        return res.redirect(
            "/tela-inicial?success=Cadastro Realizado"
        );


    } catch (error) {

        console.error(
            "Erro ao cadastrar usuário:",
            error
        );

        return res.redirect(
            "/?error=Erro ao cadastrar usuário."
        );

    }

});


module.exports = router;

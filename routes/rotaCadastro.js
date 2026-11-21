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

        //validação da segurança da senha
        const senhaSegura =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!senhaSegura.test(senha)) {
            return res.redirect(
                "/?error=A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo."
            );
        }


        //validação da data de nascimento
        if (!dataNascimento) {
            return res.redirect(
                "/?error=Informe sua data de nascimento."
            );
        }


        //verifica se a data é válida
        const [anoNascimento, mesNascimento, diaNascimento] =
            dataNascimento.split("-").map(Number);

        const dataInformada = new Date(
            anoNascimento,
            mesNascimento - 1,
            diaNascimento
        );

        const dataValida =
            dataInformada.getFullYear() === anoNascimento &&
            dataInformada.getMonth() === mesNascimento - 1 &&
            dataInformada.getDate() === diaNascimento;

        if (!dataValida) {
            return res.redirect(
                "/?error=Informe uma data de nascimento válida."
            );
        }

        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);


        //impede nascimento no futuro
        if (dataInformada > hoje) {
            return res.redirect(
                "/?error=A data de nascimento não pode ser futura."
            );
        }

        const tipo_usuario = 0;


        if (!nome || !email || !senha || !confirmarSenha || !dataNascimento) {

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


        await conn.query("SET autocommit = 1");

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

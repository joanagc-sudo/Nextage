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
            foto: usuario.foto,
            tipo_usuario: usuario.tipo_usuario

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

router.get("/api/cronograma", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Faça login para acessar seu cronograma."
            });
        }

        const idUsuario = req.session.usuario.id;

        const [resultados] = await conn.query(
            `SELECT id_cronograma, domingo, segunda, terca,
                    quarta, quinta, sexta, sabado
             FROM cronograma_estudos
             WHERE id_usuario = ?
             LIMIT 1`,
            [idUsuario]
        );

        return res.json({
            cronograma: resultados[0] || null
        });

    } catch (erro) {
        console.error("Erro ao buscar cronograma:", erro);
        return res.status(500).json({
            erro: "Não foi possível buscar o cronograma."
        });
    }
});
//CRONOGRAMA

// Salvar ou atualizar o cronograma do usuário logado
router.post("/api/cronograma", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Faça login para salvar seu cronograma."
            });
        }

        const idUsuario = req.session.usuario.id;

        const dias = [
            "domingo", "segunda", "terca", "quarta",
            "quinta", "sexta", "sabado"
        ];

        const valores = dias.map(dia => {
            const valor = req.body[dia];
            return typeof valor === "string"
                ? valor.trim()
                : "";
        });

        if (valores.some(valor => valor.length > 1000)) {
            return res.status(400).json({
                erro: "Cada dia pode conter até 1000 caracteres."
            });
        }

        const [existentes] = await conn.query(
            `SELECT id_cronograma
             FROM cronograma_estudos
             WHERE id_usuario = ?
             LIMIT 1`,
            [idUsuario]
        );

        if (existentes.length > 0) {
            await conn.query(
                `UPDATE cronograma_estudos
                 SET domingo = ?, segunda = ?, terca = ?,
                     quarta = ?, quinta = ?, sexta = ?, sabado = ?
                 WHERE id_cronograma = ?
                   AND id_usuario = ?`,
                [
                    ...valores,
                    existentes[0].id_cronograma,
                    idUsuario
                ]
            );
        } else {
            await conn.query(
                `INSERT INTO cronograma_estudos
                 (id_usuario, domingo, segunda, terca,
                  quarta, quinta, sexta, sabado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [idUsuario, ...valores]
            );
        }

        return res.json({
            mensagem: "Cronograma salvo com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao salvar cronograma:", erro);
        return res.status(500).json({
            erro: "Não foi possível salvar o cronograma."
        });
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



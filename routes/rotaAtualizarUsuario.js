
const express = require("express");
const bcrypt = require("bcrypt");
const conn = require("../database");

const router = express.Router();

// Abrir página de atualização
router.get("/atualizar-usuario", async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    try {
        const [usuarios] = await conn.query(
            `SELECT nome, email, data_nascimento
             FROM Usuarios_Administradores_Estudantes
             WHERE id_usuario = ?`,
            [req.session.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.redirect("/tela-login");
        }

        res.render("atualizarUsuario", {
            layout: "/layouts/simples",
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar os dados.");
    }
});


// Salvar alterações
router.post("/atualizar-usuario", async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    try {

        const {
            nome,
            email,
            dataNascimento,
            senha
        } = req.body;

        if (!nome || !email || !dataNascimento) {
            return res.redirect(
                "/atualizar-usuario?error=Preencha os campos obrigatórios."
            );
        }

        // Verificar se o e-mail já pertence a outro usuário
        const [emailExistente] = await conn.query(
            `SELECT id_usuario
             FROM Usuarios_Administradores_Estudantes
             WHERE email = ? AND id_usuario != ?`,
            [email, req.session.usuario.id]
        );

        if (emailExistente.length > 0) {
            return res.redirect(
                "/atualizar-usuario?error=Este e-mail já está em uso."
            );
        }

        // Se o usuário informou uma nova senha
        if (senha && senha.trim() !== "") {

            const senhaCriptografada = await bcrypt.hash(senha, 10);

            await conn.query(
                `UPDATE Usuarios_Administradores_Estudantes
                 SET nome = ?,
                     email = ?,
                     data_nascimento = ?,
                     senha = ?
                 WHERE id_usuario = ?`,
                [
                    nome,
                    email,
                    dataNascimento,
                    senhaCriptografada,
                    req.session.usuario.id
                ]
            );

        } else {

            // Atualizar sem alterar a senha
            await conn.query(
                `UPDATE Usuarios_Administradores_Estudantes
                 SET nome = ?,
                     email = ?,
                     data_nascimento = ?
                 WHERE id_usuario = ?`,
                [
                    nome,
                    email,
                    dataNascimento,
                    req.session.usuario.id
                ]
            );
        }

        // Atualizar informações da sessão
        req.session.usuario.nome = nome;
        req.session.usuario.email = email;

        return res.redirect(
            "/atualizar-usuario?success=Dados atualizados com sucesso."
        );

    } catch (error) {

        console.error("Erro ao atualizar usuário:", error);

        return res.redirect(
            "/atualizar-usuario?error=Erro ao atualizar os dados."
        );
    }
});

module.exports = router;


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
            "/tela-inicial?success=Dados atualizados com sucesso!"
        );

    } catch (error) {

        console.error("Erro ao atualizar usuário:", error);

        return res.redirect(
            "/atualizar-usuario?error=Erro ao atualizar os dados."
        );
    }
});

// APAGAR CONTA
router.post("/apagar-usuario", async (req, res) => {

    // Verifica se o usuário está logado
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    const idUsuario = req.session.usuario.id;

    // Obtém uma conexão para realizar a transação
    const conexao = await conn.getConnection();

    try {

        await conexao.beginTransaction();

        // 1. Excluir respostas de questões
        await conexao.query(
            `DELETE FROM responder
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 2. Excluir cronograma de estudos
        await conexao.query(
            `DELETE FROM cronograma_estudos
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 3. Excluir cronômetros
        await conexao.query(
            `DELETE FROM cronometros
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 4. Excluir relatórios de desempenho
        await conexao.query(
            `DELETE FROM relatorio_desempenho
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 5. Excluir materiais cadastrados pelo usuário
        await conexao.query(
            `DELETE FROM materiais
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 6. Excluir tópicos do fórum cadastrados pelo usuário
        await conexao.query(
            `DELETE FROM topicos_forum
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // 7. Excluir o próprio usuário
        await conexao.query(
            `DELETE FROM Usuarios_Administradores_Estudantes
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // Confirma todas as exclusões
        await conexao.commit();

        conexao.release();

        // Encerra a sessão do usuário
        req.session.destroy((erro) => {

            if (erro) {
                console.error("Erro ao encerrar sessão:", erro);
                return res.redirect("/tela-login");
            }

            res.clearCookie("connect.sid");

            return res.redirect(
                "/tela-login?success=Conta apagada com sucesso!"
            );
        });

    } catch (error) {

        // Desfaz as exclusões caso ocorra algum erro
        await conexao.rollback();

        conexao.release();

        console.error("Erro ao apagar conta:", error);

        return res.redirect(
            "/atualizar-usuario?error=Não foi possível apagar sua conta."
        );
    }
});

module.exports = router;


const express = require("express");
const bcrypt = require("bcrypt");
const conn = require("../database");

const router = express.Router();

// abre a página de atualização
router.get("/atualizar-usuario", async (req, res) => {

    // verifica se o usuário está logado
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    try {
        // busca os dados do usuário
        const [usuarios] = await conn.query(
            `SELECT nome, email, data_nascimento
             FROM Usuarios_Administradores_Estudantes
             WHERE id_usuario = ?`,
            [req.session.usuario.id]
        );

        // verifica se o usuário existe
        if (usuarios.length === 0) {
            return res.redirect("/tela-login");
        }

        // carrega a página com os dados
        res.render("atualizarUsuario", {
            layout: "/layouts/simples",
            usuario: usuarios[0]
        });

    } catch (error) {

        // exibe o erro no terminal
        console.error(error);

        // retorna uma mensagem de erro
        res.status(500).send("Erro ao carregar os dados.");
    }
});


// salva as alterações do usuário
router.post("/atualizar-usuario", async (req, res) => {

    // verifica se o usuário está logado
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    try {

        // recebe os dados do formulário
        const {
            nome,
            email,
            dataNascimento,
            senha
        } = req.body;

        // verifica os campos obrigatórios
        if (!nome || !email || !dataNascimento) {
            return res.redirect(
                "/atualizar-usuario?error=Preencha os campos obrigatórios."
            );
        }

        // verifica se o e-mail já está cadastrado
        const [emailExistente] = await conn.query(
            `SELECT id_usuario
             FROM Usuarios_Administradores_Estudantes
             WHERE email = ? AND id_usuario != ?`,
            [email, req.session.usuario.id]
        );

        // impede o uso de um e-mail existente
        if (emailExistente.length > 0) {
            return res.redirect(
                "/atualizar-usuario?error=Este e-mail já está em uso."
            );
        }

        // verifica se uma nova senha foi informada
        if (senha && senha.trim() !== "") {

            // criptografa a nova senha
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            // atualiza os dados e a senha
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

            // atualiza os dados sem alterar a senha
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

        // atualiza os dados da sessão
        req.session.usuario.nome = nome;
        req.session.usuario.email = email;

        // retorna para a página inicial
        return res.redirect(
            "/tela-inicial?success=Dados atualizados com sucesso!"
        );

    } catch (error) {

        // exibe o erro no terminal
        console.error("Erro ao atualizar usuário:", error);

        // retorna uma mensagem de erro
        return res.redirect(
            "/atualizar-usuario?error=Erro ao atualizar os dados."
        );
    }
});


// apaga a conta do usuário
router.post("/apagar-usuario", async (req, res) => {

    // verifica se o usuário está logado
    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    // obtém o id do usuário
    const idUsuario = req.session.usuario.id;

    // obtém uma conexão para a transação
    const conexao = await conn.getConnection();

    try {

        // inicia a transação
        await conexao.beginTransaction();

        // exclui as respostas
        await conexao.query(
            `DELETE FROM responder
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui o cronograma
        await conexao.query(
            `DELETE FROM cronograma_estudos
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui os cronômetros
        await conexao.query(
            `DELETE FROM cronometros
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui os relatórios
        await conexao.query(
            `DELETE FROM relatorio_desempenho
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui os materiais
        await conexao.query(
            `DELETE FROM materiais
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui os tópicos do fórum
        await conexao.query(
            `DELETE FROM topicos_forum
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // exclui o usuário
        await conexao.query(
            `DELETE FROM Usuarios_Administradores_Estudantes
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        // confirma as exclusões
        await conexao.commit();

        conexao.release();

        // encerra a sessão do usuário
        req.session.destroy((erro) => {

            // verifica se ocorreu algum erro
            if (erro) {
                console.error("Erro ao encerrar sessão:", erro);
                return res.redirect("/tela-login");
            }

            // limpa o cookie da sessão
            res.clearCookie("connect.sid");

            // redireciona após a exclusão
            return res.redirect(
                "/tela-login?success=Conta apagada com sucesso!"
            );
        });

    } catch (error) {

        // desfaz as alterações em caso de erro
        await conexao.rollback();

        conexao.release();

        // exibe o erro no terminal
        console.error("Erro ao apagar conta:", error);

        // retorna uma mensagem de erro
        return res.redirect(
            "/atualizar-usuario?error=Não foi possível apagar sua conta."
        );
    }
});


// exporta as rotas
module.exports = router;

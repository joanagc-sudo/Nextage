const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");

const router = express.Router();

// administradores 
function apenasAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect(
            "/tela-inicial?error=Faça login."
        );

    }
    if (Number(req.session.usuario.tipo_usuario) !== 1) {
        return res.redirect(
            "/tela-inicial?error=Acesso permitido apenas para administradores."
        );
    }
    next();
}

//rota para gerenciar usuários
router.get("/gerenciar-usuarios", verificarAdmin, (req, res) => {

    const sql = `
        SELECT
            id_usuario,
            nome,
            email,
            tipo_usuario
        FROM usuarios_administradores_estudantes
        ORDER BY nome ASC
    `;

    db.query(sql, (erro, resultados) => {

        if (erro) {
            return res.redirect(
            "/admin?error=Erro ao buscar usuários."
        );
            console.log(erro);
        }

        res.render("gerenciarUsuarios", {
            usuarios: resultados,
            layout: "layouts/mainAdmin"
        });

    });

    });

    //cadastro de usuários
    router.post("/gerenciar-usuarios/cadastrar", verificarAdmin, async (req, res) => {

    const { nome, email, senha, confirmarSenha, tipo_usuario } = req.body;

    if (!nome || !email || !senha || !confirmarSenha) {
        return res.redirect("/gerenciar-usuarios");
    }

    if (senha !== confirmarSenha) {
        return res.redirect("/gerenciar-usuarios?error=senhas");
    }

    if (!["0", "1"].includes(tipo_usuario)) {
        return res.redirect("/gerenciar-usuarios?error=Tipo de usuário inválido.");

    }

    try {

        // verificar se o email já está cadastrado
        const sqlVerificar = `
            SELECT id_usuario
            FROM usuarios_administradores_estudantes
            WHERE email = ?
        `;

        db.query(sqlVerificar, [email], async (erro, resultados) => {

            if (erro) {
                console.log(erro);
                return res.redirect("/gerenciar-usuarios?error=Erro ao veificar usuário.");
            }

            if (resultados.length > 0) {
                return res.redirect("/gerenciar-usuarios?error=email");
            }

            // criptografar senha
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            const sqlInserir = `
                INSERT INTO usuarios_administradores_estudantes
                (nome, email, senha, tipo_usuario)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                sqlInserir,
                [nome, email, senhaCriptografada, Number(tipo_usuario)],
                (erro) => {

                    if (erro) {
                        console.log(erro);
                        return res.redirect("/gerenciar-usuarios?error=Erro ao cadastrar usuário.");
                    }

                    res.redirect("/gerenciar-usuarios?success=cadastro");
                }
            );

        });

    } catch (erro) {
        console.log(erro);
        res.redirect("/gerenciar-usuarios?error=Erro ao cadastrar usuário.");
    }

});


router.post("/gerenciar-usuarios/excluir/:id", verificarAdmin, (req, res) => {

    const id = req.params.id;

    const admin = req.session.admin || req.session.usuario;

    // Impedir que o administrador exclua a própria conta
    if (admin.id_usuario == id) {
        return res.redirect("/gerenciar-usuarios?erro=propria-conta");
    }

    const sql = `
        DELETE FROM usuarios_administradores_estudantes
        WHERE id_usuario = ?
    `;

    db.query(sql, [id], (erro, resultado) => {

        if (erro) {
            console.log(erro);
            return res.status(500).send("Erro ao excluir usuário.");
        }

        if (resultado.affectedRows === 0) {
            return res.redirect("/gerenciar-usuarios?erro=nao-encontrado");
        }

        res.redirect("/gerenciar-usuarios?sucesso=exclusao");

    });

});
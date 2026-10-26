const express = require("express");
const bcrypt = require("bcrypt");
const conn = require("../database");

const router = express.Router();

// Verifica se o administrador está autenticado
function verificarAdministrador(req, res, next) {

    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    next();

}
router.get("/admin/login", (req, res) => {

    if (req.session.admin) {
        return res.redirect("/admin");
    }

    res.render("admin/loginAdmin", {
        layout: "layouts/simples",
        query: req.query
    });

});


// Realizar login administrativo
router.post("/admin/login", async (req, res) => {

    try {
    const { email, senha } = req.body;

        if (!email || !senha) {
            return res.redirect("/admin/login?error=Informe o e-mail e a senha.");
        }

        const [usuarios] = await conn.query(
            `
            SELECT
                id_usuario,
                nome,
                email,
                senha,
                tipo_usuario
            FROM usuarios_administradores_estudantes
            WHERE email = ?
            `,
            [email]
        );

        if (usuarios.length === 0) {

            return res.redirect(
                "/admin/login?error=E-mail ou senha incorretos."
            );

        }

        const usuario = usuarios[0];

        // Verifica se é administrador
        if (Number(usuario.tipo_usuario) !== 1) {

            return res.redirect(
                "/admin/login?error=Acesso restrito aos administradores."
            );

        }

        // Verifica a senha
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {

            return res.redirect(
                "/admin/login?error=E-mail ou senha incorretos."
            );

        }

        // Cria a sessão administrativa
        req.session.admin = {

            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email

        };

        return res.redirect("/admin");

    } catch (erro) {

        console.error(
            "Erro no login administrativo:",
            erro
        );

        return res.redirect(
            "/admin/login?error=Erro ao realizar login."
        );

    }

});


// Painel administrativo
router.get(
    "/admin",
    verificarAdministrador,
    (req, res) => {

        res.render("admin/painelAdmin", {
            layout: "layouts/main",
            admin: req.session.admin
        });

    }
);


// Sair do painel administrativo
router.get("/admin/logout", (req, res) => {

    delete req.session.admin;

    res.redirect("/tela-inicial");

});


module.exports = router;
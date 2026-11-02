
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

// Página de login administrativo
router.get("/admin/login", (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin");
    }

    res.render("administrador/loginAdmin", {
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
            `SELECT id_usuario, nome, email, senha, tipo_usuario
             FROM usuarios_administradores_estudantes
             WHERE email = ?`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.redirect("/admin/login?error=E-mail ou senha incorretos.");
        }

        const usuario = usuarios[0];

        if (Number(usuario.tipo_usuario) !== 1) {
            return res.redirect("/admin/login?error=Acesso restrito aos administradores.");
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.redirect("/admin/login?error=E-mail ou senha incorretos.");
        }

        req.session.admin = {
            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email
        };

        return res.redirect("/admin");

    } catch (erro) {
        console.error("Erro no login administrativo:", erro);
        return res.redirect("/admin/login?error=Erro ao realizar login.");
    }
});

// Painel administrativo
router.get("/admin", verificarAdministrador, (req, res) => {
    res.render("administrador/painelAdmin", {
        layout: "layouts/mainAdmin",
        admin: req.session.admin,
        query: req.query
    });
});

// Sair da área administrativa
router.get("/admin/logout", (req, res) => {
    delete req.session.admin;

    res.redirect("/tela-inicial");
});

module.exports = router;

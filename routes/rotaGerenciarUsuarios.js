const express = require("express");
const bcrypt = require("bcrypt");
const conn = require("../database");

const router = express.Router();

function idLogado(req) {
    const u = req.session.usuario;
    if (!u) return null;
    return u.id ?? u.id_usuario ?? null;
}

async function apenasAdmin(req, res, next) {
    try {
        const id = idLogado(req);

        if (!id) {
            return res.redirect("/tela-login");
        }

        const [rows] = await conn.query(
            `SELECT tipo_usuario
             FROM Usuarios_Administradores_Estudantes
             WHERE id_usuario = ?`,
            [id]
        );

        if (rows.length === 0 || Number(rows[0].tipo_usuario) !== 1) {
            return res.status(403).send("Acesso negado.");
        }

        next();
    } catch (error) {
        next(error);
    }
}

//lista de usuarios
router.get("/admin/usuarios", apenasAdmin, async (req, res) => {
    try {
        const [usuarios] = await conn.query(
            `SELECT id_usuario, nome, email, data_nascimento, tipo_usuario
             FROM Usuarios_Administradores_Estudantes
             ORDER BY tipo_usuario DESC, id_usuario ASC`
        );

        const lista = usuarios.map((u) => ({
            id: u.id_usuario,
            nome: u.nome,
            email: u.email,
            dataNascimento: u.data_nascimento
                ? new Date(u.data_nascimento).toLocaleDateString("pt-BR")
                : "-",
            ehAdmin: Number(u.tipo_usuario) === 1,
            ehVoce: u.id_usuario === idLogado(req)
        }));

        res.render("indexGerenciarUsuarios", {
            layout: "/layouts/mainAdmin",
            usuarios: lista,
            total: lista.length
        });
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).send("Erro ao carregar usuários.");
    }
});

//cadastro usuarios
router.post("/admin/usuarios", apenasAdmin, async (req, res) => {
    try {
        const {nome, email, senha, dataNascimento, tipo} = req.body;

        if (!nome || !email || !senha || !dataNascimento) {
            return res.status(400).json({ ok: false, erro: "Preencha todos os campos." });
        }

        const tipo_usuario = Number(tipo) === 1 ? 1 : 0;

        const [existente] = await conn.query(
            `SELECT id_usuario
             FROM Usuarios_Administradores_Estudantes
             WHERE email = ?`,
            [email]
        );

        if (existente.length > 0) {
            return res.status(409).json({ ok: false, erro: "Este e-mail já está cadastrado." });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await conn.query("SET autocommit = 1");
        const [resultado] = await conn.query(
            `INSERT INTO Usuarios_Administradores_Estudantes
             (nome, email, senha, data_nascimento, tipo_usuario)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, email, senhaCriptografada, dataNascimento, tipo_usuario]
        );

        res.status(201).json({ ok: true, id: resultado.insertId });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({ ok: false, erro: "Erro ao cadastrar usuário." });
    }
});

// excluir - apaga todos os dados relacionados
router.delete("/admin/usuarios/:id", apenasAdmin, async (req, res) => {
    const ehPool = typeof conn.getConnection === "function";
    const c = ehPool ? await conn.getConnection() : conn;

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({ ok: false, erro: "ID inválido." });
        }

        if (id === idLogado(req)) {
            return res.status(400).json({ ok: false, erro: "Você não pode excluir a sua própria conta." });
        }

        await c.beginTransaction();

        await c.query(
            `DELETE FROM conteudo_material
             WHERE id_material IN (SELECT id_material FROM materiais WHERE id_usuario = ?)`, [id]);
        await c.query(
            `DELETE FROM conteudos_topicosforum
             WHERE id_topico IN (SELECT id_topico FROM topicos_forum WHERE id_usuario = ?)`, [id]);

        await c.query("DELETE FROM materiais WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM topicos_forum WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM cronograma_estudos WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM cronometros WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM relatorio_desempenho WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM responder WHERE id_usuario = ?", [id]);
        await c.query("DELETE FROM lembretes WHERE id_usuario = ?", [id]);

        const [resultado] = await c.query(
            "DELETE FROM Usuarios_Administradores_Estudantes WHERE id_usuario = ?", [id]);

        if (resultado.affectedRows === 0) {
            await c.rollback();
            return res.status(404).json({ ok: false, erro: "Usuário não encontrado." });
        }

        await c.commit();
        res.json({ ok: true });
    } catch (error) {
        await c.rollback();
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ ok: false, erro: "Erro ao excluir usuário." });
    } finally {
        if (ehPool) c.release();
    }
});

module.exports = router;

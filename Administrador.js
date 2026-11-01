
const bcrypt = require("bcrypt");
const conn = require("./database");

async function criarAdministrador() {
    try {
        const nome = "Administrador Nextage";
        const email = "admin@nextage.com";
        const senha = "Nextage@2026";
        const dataNascimento = "2000-01-01";
        const tipo_usuario = 1;

        const [usuarios] = await conn.query(
            `SELECT id_usuario FROM usuarios_administradores_estudantes WHERE email = ?`,
            [email]
        );

        if (usuarios.length > 0) {
            console.log("Este administrador já existe.");
            return;
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await conn.query(
            `INSERT INTO usuarios_administradores_estudantes
            (nome, email, senha, data_nascimento, tipo_usuario)
            VALUES (?, ?, ?, ?, ?)`,
            [nome, email, senhaCriptografada, dataNascimento, tipo_usuario]
        );

        console.log("Administrador cadastrado com sucesso!");

    } catch (erro) {
        console.error("Erro ao criar administrador:", erro);
    } finally {
        await conn.end();
    }
}

criarAdministrador();

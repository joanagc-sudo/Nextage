const db = require("./database");

async function configurarDisciplinas() {
    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        // Disciplinas que devem existir no sistema
        const disciplinas = [
            { nome: "Geografia", rota: "/materiais" },
            { nome: "Biologia", rota: "/biologia" },
            { nome: "Espanhol", rota: "/espanhol" },
            { nome: "Física", rota: "/fisica" },
            { nome: "Filosofia", rota: "/filosofia" },
            { nome: "História", rota: "/historia" },
            { nome: "Inglês", rota: "/ingles" },
            { nome: "Matemática", rota: "/matematica" },
            { nome: "Português", rota: "/portugues" },
            { nome: "Química", rota: "/quimica" },
            { nome: "Sociologia", rota: "/sociologia" }
        ];

        // Cria uma tabela específica para relacionar
        // cada disciplina à sua página.
        await conexao.query(`
            CREATE TABLE IF NOT EXISTS disciplinas_paginas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_disciplina INT NOT NULL UNIQUE,
                rota VARCHAR(100) NOT NULL UNIQUE,
                FOREIGN KEY (id_disciplina)
                    REFERENCES disciplinas(id_disciplina)
            )
        `);

        for (const disciplina of disciplinas) {
            // Procura a disciplina existente
            const [existentes] = await conexao.query(
                `SELECT id_disciplina
                 FROM disciplinas
                 WHERE nome = ?
                 LIMIT 1`,
                [disciplina.nome]
            );

            if (existentes.length === 0) {
                console.log(
                    `A disciplina "${disciplina.nome}" não existe na tabela disciplinas.`
                );

                continue;
            }

            const idDisciplina = existentes[0].id_disciplina;

            // Cadastra ou atualiza a rota da disciplina
            await conexao.query(
                `INSERT INTO disciplinas_paginas
                    (id_disciplina, rota)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE rota = VALUES(rota)`,
                [idDisciplina, disciplina.rota]
            );

            console.log(
                `${disciplina.nome}: ${disciplina.rota}`
            );
        }

        await conexao.commit();

        console.log(
            "Configuração das disciplinas concluída!"
        );

    } catch (erro) {
        await conexao.rollback();

        console.error(
            "Erro ao configurar as disciplinas:",
            erro
        );

        throw erro;

    } finally {
        conexao.release();
        await db.end();
    }
}

configurarDisciplinas()
    .catch(() => {
        process.exitCode = 1;
    });
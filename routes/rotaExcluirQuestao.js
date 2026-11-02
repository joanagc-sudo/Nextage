const express = require("express");

const db = require("../database");

const router = express.Router();


// verifica se o usuário é administrador
function apenasAdmin(req, res, next) {

    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Faça login."
        });
    }

    if (Number(req.session.usuario.tipo_usuario) !== 1) {
        return res.status(403).json({
            erro: "Acesso permitido somente para administradores."
        });
    }

    next();
}


// excluir
router.delete("/api/questoes-admin/:id", apenasAdmin, async (req, res) => {

    const id = req.params.id;

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();


        // exclui as respostas dos usuários relacionadas à questão
        await connection.query(
            "DELETE FROM responder WHERE id_questao = ?",
            [id]
        );


        // exclui os conteúdos relacionados à questão
        await connection.query(
            "DELETE FROM questoes_conteudos WHERE id_questao = ?",
            [id]
        );


        // exclui as alternativas da questão
        await connection.query(
            "DELETE FROM alternativas WHERE questoes_id_questao = ?",
            [id]
        );


        // exclui a questão
        const [resultado] = await connection.query(
            "DELETE FROM questoes WHERE id_questao = ?",
            [id]
        );


        // verifica se a questão existia
        if (resultado.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                erro: "Questão não encontrada."
            });

        }


        // Confirma as exclusões
        await connection.commit();

        return res.status(200).json({
            mensagem: "Questão excluída com sucesso!"
        });


    } catch (erro) {

        if (connection) {
            await connection.rollback();
        }

        console.error("Erro ao excluir questão:", erro);

        return res.status(500).json({
            erro: "Erro ao excluir questão."
        });


    } finally {

        if (connection) {
            connection.release();
        }

    }

});


module.exports = router;
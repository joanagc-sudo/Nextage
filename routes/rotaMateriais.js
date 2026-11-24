const express = require("express");
const router = express.Router();
const conn = require("../database");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// garante que a pasta de materiais exista
const pastaMateriais = path.join(
    __dirname,
    "..",
    "public",
    "imagens",
    "materiais"
);

if (!fs.existsSync(pastaMateriais)) {
    fs.mkdirSync(pastaMateriais, { recursive: true });
}

// define onde os arquivos enviados serão armazenados
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pastaMateriais);
    },

    filename: function (req, file, cb) {
        const nomeArquivo = Date.now() + "-" + file.originalname;
        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
});

// verifica se o administrador ta logado
function verificarAdministrador(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({
            erro: "Acesso restrito ao administrador."
        });
    }

    next();
}

// cadastra um novo material
router.post("/", upload.single("arquivo"), async (req, res) => {
    let arquivoSalvo = null;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                erro: "Nenhum arquivo foi enviado."
            });
        }

        const titulo = req.body.titulo;
        const descricao = req.body.descricao;
        const arquivo = req.file.filename;

        arquivoSalvo = arquivo;

        const idUsuario = req.session.usuario.id;

        await conn.query(`
            INSERT INTO materiais (
                id_material,
                id_usuario,
                titulo,
                material_arquivo,
                data_publicacao,
                autor,
                aprovado_publicacao,
                descricao
            )
            VALUES (null, ?, ?, ?, CURDATE(), ?, 1, ?)
        `, [
            idUsuario,
            titulo,
            arquivo,
            req.session.usuario.nome,
            descricao
        ]);

        return res.json({
            sucesso: true
        });

    } catch (error) {
        console.error("Erro ao salvar material:", error);

        // remove o arquivo caso o cadastro no banco não seja concluído
        if (arquivoSalvo) {
            const caminhoArquivo = path.join(pastaMateriais, arquivoSalvo);

            fs.unlink(caminhoArquivo, function (erro) {
                if (erro && erro.code !== "ENOENT") {
                    console.error("Erro ao remover arquivo:", erro);
                }
            });
        }

        return res.status(500).json({
            erro: "Erro ao salvar material."
        });
    }
});

// busca os materiais compartilhados de um assunto
router.get("/assunto/:materia", async (req, res) => {
    try {
        const materia = req.params.materia;

        const [materiais] = await conn.query(`
            SELECT
                id_material,
                titulo,
                descricao,
                material_arquivo,
                autor,
                data_publicacao
            FROM materiais
            WHERE descricao = ?
            AND aprovado_publicacao = 1
            ORDER BY id_material DESC
        `, [materia]);

        return res.json(materiais);

    } catch (error) {
        console.error("Erro ao buscar materiais do assunto:", error);

        return res.status(500).json({
            erro: "Não foi possível buscar os materiais."
        });
    }
});

// busca os materiais cadastrados pelo usuário logado
router.get("/lista", async (req, res) => {
    
    try {
        
        console.log("===== TESTE DA SESSÃO =====");
        console.log("ID da sessão:", req.sessionID);
        console.log("Usuário da sessão:", req.session.usuario);
        console.log("===========================");
        
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.id;

        const [materiais] = await conn.query(`
            SELECT
                id_material,
                titulo,
                descricao,
                material_arquivo,
                autor,
                data_publicacao
            FROM materiais
            WHERE id_usuario = ?
            ORDER BY id_material DESC
        `, [idUsuario]);

        return res.json(materiais);

    } catch (error) {
        console.error("Erro ao buscar materiais:", error);

        return res.status(500).json({
            erro: "Erro ao buscar materiais."
        });
    }
});

// exclui um material que pertence ao usuário logado
router.delete("/:id", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idMaterial = req.params.id;
        const idUsuario = req.session.usuario.id;

        // verifica se o material pertence ao usuário
        const [materiais] = await conn.query(`
            SELECT material_arquivo
            FROM materiais
            WHERE id_material = ?
            AND id_usuario = ?
        `, [
            idMaterial,
            idUsuario
        ]);

        if (materiais.length === 0) {
            return res.status(404).json({
                erro: "Material não encontrado ou você não tem permissão para excluí-lo."
            });
        }

        const nomeArquivo = materiais[0].material_arquivo;

        // exclui o registro somente se ele pertencer ao usuário
        const [resultado] = await conn.query(`
            DELETE FROM materiais
            WHERE id_material = ?
            AND id_usuario = ?
        `, [
            idMaterial,
            idUsuario
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Não foi possível excluir o material."
            });
        }

        // remove o arquivo da pasta depois de excluir o registro
        if (nomeArquivo) {
            const caminhoArquivo = path.join(
                pastaMateriais,
                nomeArquivo
            );

            fs.unlink(caminhoArquivo, function (erro) {
                if (erro && erro.code !== "ENOENT") {
                    console.error("Erro ao excluir arquivo:", erro);
                }
            });
        }

        return res.json({
            sucesso: true
        });

    } catch (error) {
        console.error("Erro ao excluir material:", error);

        return res.status(500).json({
            erro: "Erro ao excluir material."
        });
    }
});

// rota pro administrador

// busca os conteúdos disponíveis para cadastro
router.get("/admin/opcoes", verificarAdministrador, async (req, res) => {
    try {
        const [conteudos] = await conn.query(`
            SELECT
                c.id_conteudo,
                c.nome AS conteudo,
                d.nome AS disciplina
            FROM conteudos c
            INNER JOIN disciplinas d
                ON c.id_disciplina = d.id_disciplina
            ORDER BY d.nome, c.nome
        `);

        return res.json(conteudos);

    } catch (error) {
        console.error("Erro ao buscar conteúdos:", error);

        return res.status(500).json({
            erro: "Erro ao carregar os conteúdos."
        });
    }
});


// lista todos os materiais cadastrados
router.get("/admin/lista", verificarAdministrador, async (req, res) => {
    try {
        const [materiais] = await conn.query(`
            SELECT
                m.id_material,
                m.titulo,
                m.material_arquivo,
                DATE_FORMAT(m.data_publicacao, '%d/%m/%Y') AS data_publicacao,
                m.autor,
                m.descricao,
                GROUP_CONCAT(DISTINCT c.nome SEPARATOR ', ') AS conteudo,
                GROUP_CONCAT(DISTINCT d.nome SEPARATOR ', ') AS disciplina
            FROM materiais m
            LEFT JOIN conteudo_material cm
                ON m.id_material = cm.id_material
            LEFT JOIN conteudos c
                ON cm.id_conteudo = c.id_conteudo
            LEFT JOIN disciplinas d
                ON c.id_disciplina = d.id_disciplina
            GROUP BY m.id_material
            ORDER BY m.id_material DESC
        `);

        return res.json(materiais);

    } catch (error) {
        console.error("Erro ao listar materiais:", error);

        return res.status(500).json({
            erro: "Erro ao carregar os materiais."
        });
    }
});


// cadastra um material pelo administrador
router.post(
    "/admin",
    verificarAdministrador,
    upload.single("arquivo"),
    async (req, res) => {

        let arquivoSalvo = null;
        let idMaterial = null;

        try {
            const titulo = req.body.titulo;
            const idConteudo = Number(req.body.id_conteudo);
            const descricao = req.body.descricao;

            if (!titulo || !idConteudo || !descricao || !req.file) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    erro: "Preencha todos os campos e envie um arquivo."
                });
            }

            arquivoSalvo = req.file.filename;

            const idUsuario = req.session.admin.id;
            const autor = req.session.admin.nome;

            const [resultado] = await conn.query(`
                INSERT INTO materiais (
                    id_usuario,
                    titulo,
                    material_arquivo,
                    data_publicacao,
                    autor,
                    aprovado_publicacao,
                    descricao
                )
                VALUES (?, ?, ?, CURDATE(), ?, 1, ?)
            `, [
                idUsuario,
                titulo,
                arquivoSalvo,
                autor,
                descricao
            ]);

            idMaterial = resultado.insertId;

            await conn.query(`
                INSERT INTO conteudo_material (
                    id_conteudo,
                    id_material
                )
                VALUES (?, ?)
            `, [
                idConteudo,
                idMaterial
            ]);

            return res.json({
                sucesso: true,
                mensagem: "Material cadastrado com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao cadastrar material pelo administrador:", error);

            // remove o registro caso o relacionamento não seja criado
            if (idMaterial) {
                try {
                    await conn.query(
                        "DELETE FROM conteudo_material WHERE id_material = ?",
                        [idMaterial]
                    );

                    await conn.query(
                        "DELETE FROM materiais WHERE id_material = ?",
                        [idMaterial]
                    );
                } catch (erroBanco) {
                    console.error("Erro ao desfazer cadastro:", erroBanco);
                }
            }

            // remove o arquivo caso o cadastro falhe
            if (arquivoSalvo) {
                const caminhoArquivo = path.join(pastaMateriais, arquivoSalvo);

                fs.unlink(caminhoArquivo, function (erro) {
                    if (erro && erro.code !== "ENOENT") {
                        console.error("Erro ao remover arquivo:", erro);
                    }
                });
            }

            return res.status(500).json({
                erro: "Erro ao cadastrar material."
            });
        }
    }
);


// exclui qualquer material pelo administrador
router.delete(
    "/admin/:id",
    verificarAdministrador,
    async (req, res) => {

        try {
            const idMaterial = Number(req.params.id);

            if (!Number.isInteger(idMaterial) || idMaterial <= 0) {
                return res.status(400).json({
                    erro: "ID de material inválido."
                });
            }

            const [materiais] = await conn.query(`
                SELECT material_arquivo
                FROM materiais
                WHERE id_material = ?
            `, [idMaterial]);

            if (materiais.length === 0) {
                return res.status(404).json({
                    erro: "Material não encontrado."
                });
            }

            const nomeArquivo = materiais[0].material_arquivo;

            // remove primeiro a relação com o conteúdo
            await conn.query(`
                DELETE FROM conteudo_material
                WHERE id_material = ?
            `, [idMaterial]);

            // depois remove o material
            await conn.query(`
                DELETE FROM materiais
                WHERE id_material = ?
            `, [idMaterial]);

            // remove o arquivo da pasta
            if (nomeArquivo) {
                const caminhoArquivo = path.join(
                    pastaMateriais,
                    nomeArquivo
                );

                fs.unlink(caminhoArquivo, function (erro) {
                    if (erro && erro.code !== "ENOENT") {
                        console.error("Erro ao remover arquivo:", erro);
                    }
                });
            }

            return res.json({
                sucesso: true,
                mensagem: "Material excluído com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao excluir material pelo administrador:", error);

            return res.status(500).json({
                erro: "Erro ao excluir material."
            });
        }
    }

);

module.exports = router;
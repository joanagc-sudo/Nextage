<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // ELEMENTOS DO HTML
    // ==========================================
=======
    document.addEventListener("DOMContentLoaded", function () {

    // elementos do html
>>>>>>> branchDuda

    const btnCadastrar = document.getElementById("btnCadastrar");
    const fileInput = document.getElementById("fileInput");
    const listaMateriais = document.getElementById("listaMateriais");

    const modalMateria = document.getElementById("modalMateria");
    const selectMateria = document.getElementById("selectMateria");
    const salvarMaterial = document.getElementById("salvarMaterial");
    const cancelarMateria = document.getElementById("cancelarMateria");
    const nomeArquivo = document.getElementById("nomeArquivo");

    const assuntos = document.querySelectorAll("[data-materia]");

    // ==========================================
    // VERIFICAÇÃO DOS ELEMENTOS
    // ==========================================

    if (!btnCadastrar || !fileInput || !listaMateriais ||
        !modalMateria || !selectMateria || !salvarMaterial ||
        !cancelarMateria || !nomeArquivo) {

        console.error("Erro: elementos do HTML não encontrados.");
        return;
    }

    // ==========================================
    // VARIÁVEIS
    // ==========================================

    let arquivoSelecionado = null;
    let materiaFiltrada = null;

    // ==========================================
    // BANCO DE DADOS INDEXEDDB
    // ==========================================

    function abrirBanco() {

        return new Promise(function (resolve, reject) {

            const request = indexedDB.open("MateriaisDB", 1);

            request.onupgradeneeded = function (event) {

                const db = event.target.result;

                if (!db.objectStoreNames.contains("arquivos")) {
                    db.createObjectStore("arquivos");
                }

            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };

        });

    }

    // ==========================================
    // SALVAR ARQUIVO NO BANCO
    // ==========================================

    async function salvarArquivo(id, arquivo) {

        const db = await abrirBanco();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(
                "arquivos",
                "readwrite"
            );

            transaction.objectStore("arquivos").put(arquivo, id);

            transaction.oncomplete = function () {
                db.close();
                resolve();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

            transaction.onabort = function () {
                db.close();
                reject(transaction.error);
            };

        });

    }

    // ==========================================
    // BAIXAR ARQUIVO
    // ==========================================

    async function baixarArquivo(material) {

        if (!material.id) {
            alert("Este material é de um cadastro antigo. Cadastre o arquivo novamente.");
            return;
        }

        try {

            const db = await abrirBanco();

            const arquivo = await new Promise(function (resolve, reject) {

                const transaction = db.transaction(
                    "arquivos",
                    "readonly"
                );

                const request = transaction
                    .objectStore("arquivos")
                    .get(material.id);

                request.onsuccess = function () {
                    resolve(request.result);
                };

                request.onerror = function () {
                    reject(request.error);
                };

                transaction.oncomplete = function () {
                    db.close();
                };

            });

            if (!arquivo) {
                alert("Arquivo não encontrado. Cadastre novamente.");
                return;
            }

            // CRIA LINK TEMPORÁRIO PARA DOWNLOAD

            const url = URL.createObjectURL(arquivo);

            const link = document.createElement("a");

            link.href = url;
            link.download = material.nome;

            document.body.appendChild(link);

            link.click();

            link.remove();

            // LIBERA A MEMÓRIA

            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 1000);

        } catch (erro) {

            console.error("Erro ao baixar:", erro);
            alert("Não foi possível baixar o material.");

        }

    }

    // ==========================================
    // EXCLUIR ARQUIVO DO BANCO
    // ==========================================

    async function excluirArquivo(id) {

        if (!id) return;

        const db = await abrirBanco();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(
                "arquivos",
                "readwrite"
            );

            transaction.objectStore("arquivos").delete(id);

            transaction.oncomplete = function () {
                db.close();
                resolve();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

            transaction.onabort = function () {
                db.close();
                reject(transaction.error);
            };

        });

    }

    // ==========================================
    // LOCAL STORAGE
    // ==========================================

    function obterMateriais() {

        return JSON.parse(
            localStorage.getItem("materiais")
        ) || [];

    }

    function atualizarMateriais(materiais) {

        localStorage.setItem(
            "materiais",
            JSON.stringify(materiais)
        );

    }

    // ==========================================
    // BOTÃO + ABRE O EXPLORADOR DO WINDOWS
    // ==========================================

    btnCadastrar.addEventListener("click", function () {

        console.log("Botão + clicado!");
        fileInput.click();

    });

    // ==========================================
    // SELECIONAR ARQUIVO
    // ==========================================

    fileInput.addEventListener("change", function () {

        if (fileInput.files.length === 0) {
            return;
        }

        arquivoSelecionado = fileInput.files[0];

        console.log(
            "Arquivo escolhido:",
            arquivoSelecionado.name
        );

        nomeArquivo.textContent =
            "Arquivo: " + arquivoSelecionado.name;

        // ABRE O MODAL

        modalMateria.style.display = "flex";

    });

    // ==========================================
    // CANCELAR CADASTRO
    // ==========================================

    cancelarMateria.addEventListener("click", function () {

        modalMateria.style.display = "none";

        selectMateria.value = "";

        arquivoSelecionado = null;

        fileInput.value = "";

    });

    // ==========================================
    // SALVAR MATERIAL
    // ==========================================

    salvarMaterial.addEventListener("click", async function () {

        if (!arquivoSelecionado) {

            alert("Escolha um arquivo primeiro.");
            return;

        }

        const materia = selectMateria.value;

        if (materia === "") {

            alert("Escolha uma matéria.");
            return;

        }

        // IMPEDE CADASTRO DUPLICADO POR CLIQUES RÁPIDOS

        salvarMaterial.disabled = true;

        try {

            // CRIA IDENTIFICADOR ÚNICO

            const id = crypto.randomUUID();

            const material = {

                id: id,
                nome: arquivoSelecionado.name,
                materia: materia

            };

            // SALVA PRIMEIRO O ARQUIVO ORIGINAL

            await salvarArquivo(id, arquivoSelecionado);

            // DEPOIS SALVA AS INFORMAÇÕES

            const materiais = obterMateriais();

            materiais.push(material);

            atualizarMateriais(materiais);

            // ATUALIZA A TABELA

            adicionarMaterialNaTabela(material);

            // LIMPA O CADASTRO

            modalMateria.style.display = "none";

            selectMateria.value = "";

            arquivoSelecionado = null;

            fileInput.value = "";

            console.log("Material cadastrado com sucesso!");

        } catch (erro) {

            console.error("Erro ao cadastrar:", erro);

            alert("Não foi possível salvar o material.");

        } finally {

            salvarMaterial.disabled = false;

        }

    });

    // ==========================================
    // ADICIONAR MATERIAL NA TABELA
    // ==========================================

    function adicionarMaterialNaTabela(material) {

        const linha = document.createElement("tr");

        linha.dataset.materia = material.materia;

        // NOME DO MATERIAL

        const colunaNome = document.createElement("td");

        colunaNome.textContent = material.nome;

        // CONTEÚDO DO MATERIAL

        const colunaConteudo = document.createElement("td");

        colunaConteudo.textContent = material.materia;

        // COLUNA DOS BOTÕES

        const colunaBotao = document.createElement("td");

        colunaBotao.classList.add("acoesMaterial");

        // ======================================
        // BOTÃO BAIXAR
        // ======================================

        const botaoBaixar = document.createElement("button");

        botaoBaixar.type = "button";

        botaoBaixar.textContent = "Baixar";

        botaoBaixar.classList.add("botaoBaixar");

        botaoBaixar.addEventListener("click", function () {

            baixarArquivo(material);

        });

        // ======================================
        // BOTÃO EXCLUIR
        // ======================================

        const botaoExcluir = document.createElement("button");

        botaoExcluir.type = "button";

        botaoExcluir.textContent = "Excluir";

        botaoExcluir.classList.add("botaoExcluir");

        botaoExcluir.addEventListener("click", async function () {

            const confirmar = confirm(
                "Deseja realmente excluir o material " +
                material.nome + "?"
            );

            if (!confirmar) {
                return;
            }

            botaoExcluir.disabled = true;

            try {

                // EXCLUI O ARQUIVO ORIGINAL

                await excluirArquivo(material.id);

                // EXCLUI O REGISTRO DO LOCAL STORAGE

                let materiais = obterMateriais();

                if (material.id) {

                    materiais = materiais.filter(function (m) {
                        return m.id !== material.id;
                    });

                } else {

                    // COMPATIBILIDADE COM CADASTROS ANTIGOS

                    const indice = materiais.findIndex(function (m) {

                        return !m.id &&
                            m.nome === material.nome &&
                            m.materia === material.materia;

                    });

                    if (indice !== -1) {
                        materiais.splice(indice, 1);
                    }

                }

                atualizarMateriais(materiais);

                // REMOVE A LINHA DA TABELA

                linha.remove();

                console.log("Material excluído!");

            } catch (erro) {

                console.error("Erro ao excluir:", erro);

                alert("Não foi possível excluir o material.");

                botaoExcluir.disabled = false;

            }

        });

        // ======================================
        // ORGANIZA OS BOTÕES
        // ======================================

        const acoesMaterial = document.createElement("div");

        acoesMaterial.classList.add("acoesMaterial");

        acoesMaterial.appendChild(botaoBaixar);
        acoesMaterial.appendChild(botaoExcluir);

        colunaBotao.appendChild(acoesMaterial);

        linha.appendChild(colunaNome);

        linha.appendChild(colunaConteudo);

        linha.appendChild(colunaBotao);

        listaMateriais.appendChild(linha);
<<<<<<< HEAD

        // MANTÉM O FILTRO ATIVO

        if (materiaFiltrada !== null) {

            linha.style.display =
                material.materia === materiaFiltrada
                    ? ""
                    : "none";

        }

    }

    // ==========================================
    // CARREGAR MATERIAIS CADASTRADOS
    // ==========================================
=======
                
    }

    // carrega materiais salvos so p salva a branch
>>>>>>> branchDuda

    function carregarMateriais() {

        listaMateriais.innerHTML = "";

        const materiais = obterMateriais();

        materiais.forEach(function (material) {

            adicionarMaterialNaTabela(material);

        });

    }

    // ==========================================
    // FILTRAR MATERIAIS POR ASSUNTO
    // ==========================================

    assuntos.forEach(function (assunto) {

        assunto.addEventListener("click", function () {

            const materiaSelecionada = assunto.dataset.materia;

            // CLICAR NOVAMENTE REMOVE O FILTRO

            if (materiaFiltrada === materiaSelecionada) {

                materiaFiltrada = null;

            } else {

                materiaFiltrada = materiaSelecionada;

            }

            const linhas = listaMateriais.querySelectorAll("tr");

            linhas.forEach(function (linha) {

                if (
                    materiaFiltrada === null ||
                    linha.dataset.materia === materiaFiltrada
                ) {

                    linha.style.display = "";

                } else {

                    linha.style.display = "none";

                }

            });

        });

    });

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    carregarMateriais();

});
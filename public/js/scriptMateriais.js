document.addEventListener(
"DOMContentLoaded",
function () {

    // enviar material
    async function enviarMaterial(
    arquivo,
    materia
    ) 

    {

    const formData =
        new FormData();

    formData.append(
        "arquivo",
        arquivo
    );

    formData.append(
        "titulo",
        arquivo.name
    );

    formData.append(
        "descricao",
        materia
    );


    const resposta =
        await fetch(
            "/materiais",
            {
                method: "POST",
                body: formData
            }
        );


    const resultado =
        await resposta.json();


    if (!resposta.ok) {

        console.error(
            "Erro retornado pelo servidor:",
            resultado
        );

        throw new Error(
            resultado.erro ||
            "Erro ao cadastrar material"
        );

    }


    return resultado;


    }


    // seletor de disciplinas
    const seletorDisciplina =
        document.querySelector(
            ".seletorDisciplina"
        );

    const btnDisciplina =
        document.getElementById(
            "btnDisciplina"
        );

    const listaDisciplinas =
        document.getElementById(
            "listaDisciplinas"
        );

    const disciplinaAtual =
        document.getElementById(
            "disciplinaAtual"
        );

    const disciplinas =
        document.querySelectorAll(
            "#listaDisciplinas button"
        );

    // abrir e fechar seletor
    if (btnDisciplina) {

        btnDisciplina.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                seletorDisciplina.classList.toggle(
                    "aberto"
                );

            }
        );

    }

    // selecionar disciplina
    disciplinas.forEach(
        function (botao) {

            botao.addEventListener(
                "click",
                function () {

                    const disciplina =
                        botao.dataset.disciplina;

                    disciplinaAtual.textContent =
                        disciplina;

                    disciplinas.forEach(
                        function (item) {

                            item.classList.remove(
                                "selecionada"
                            );
                        }
                    );

                    botao.classList.add(
                        "selecionada"
                    );

                    seletorDisciplina.classList.remove(
                        "aberto"
                    );

                    console.log(
                        "Disciplina selecionada:",
                        disciplina
                    );

                }
            );

        }
    );

    // fechar ao clicar fora do modal (nao ta funcionando)
    document.addEventListener(
        "click",
        function (event) {

            if (
                seletorDisciplina &&
                !seletorDisciplina.contains(
                    event.target
                )
            ) {

                seletorDisciplina.classList.remove(
                    "aberto"
                );

            }

        }
    );

    // disciplina 
    const parametrosURL =
        new URLSearchParams(
            window.location.search
        );

    const disciplinaSelecionada =
        parametrosURL.get(
            "materia"
        );

    console.log(
        "Disciplina selecionada:",
        disciplinaSelecionada
    );

    // elementos html
    const btnCadastrar =
        document.getElementById(
            "btnCadastrar"
        );

    const fileInput =
        document.getElementById(
            "fileInput"
        );

    const listaMateriais =
        document.getElementById(
            "listaMateriais"
        );

    const modalMateria =
        document.getElementById(
            "modalMateria"
        );

    const selectMateria =
        document.getElementById(
            "selectMateria"
        );

    const salvarMaterial =
        document.getElementById(
            "salvarMaterial"
        );

    const cancelarMateria =
        document.getElementById(
            "cancelarMateria"
        );

    const nomeArquivo =
        document.getElementById(
            "nomeArquivo"
        );

    const assuntos =
        document.querySelectorAll(
            "[data-materia]"
        );

    // verificacao dos elementos
    if (
        !btnCadastrar ||
        !fileInput ||
        !listaMateriais ||
        !modalMateria ||
        !selectMateria ||
        !salvarMaterial ||
        !cancelarMateria ||
        !nomeArquivo
    ) {

        console.error(
            "Erro: elementos do HTML não encontrados."
        );

        return;

    }

    // variaveis
    let arquivoSelecionado =
        null;

    let materiaFiltrada =
        disciplinaSelecionada || null;

    // configuracao da pagina
    if (disciplinaSelecionada) {

        const opcaoExiste =
            Array.from(
                selectMateria.options
            ).some(
                function (opcao) {

                    return (
                        opcao.value ===
                        disciplinaSelecionada
                    );

                }
            );


        if (opcaoExiste) {

            selectMateria.value =
                disciplinaSelecionada;
        }

    }

    // botao maisinho
    btnCadastrar.addEventListener(
        "click",
        function () {

            console.log(
                "Botão + clicado!"
            );

            fileInput.click();

        }
    );

    // selecionar arquivo
    fileInput.addEventListener(
        "change",
        function () {

            if (
                fileInput.files.length === 0
            ) {

                return;

            }

            arquivoSelecionado =
                fileInput.files[0];

            console.log(
                "Arquivo escolhido:",
                arquivoSelecionado.name
            );

            nomeArquivo.textContent =
                "Arquivo: " +
                arquivoSelecionado.name;

            if (disciplinaSelecionada) {

                selectMateria.value =
                    disciplinaSelecionada;

            }

            modalMateria.style.display =
                "flex";
        }
    );

    // botao do modal p cancelar
    cancelarMateria.addEventListener(
        "click",
        function () {

            modalMateria.style.display =
                "none";


            selectMateria.value =
                disciplinaSelecionada || "";


            arquivoSelecionado =
                null;


            fileInput.value =
                "";

        }
    );

    // salvar material
    salvarMaterial.addEventListener(
        "click",
        async function () {

            if (!arquivoSelecionado) {

                alert(
                    "Escolha um arquivo primeiro."
                );

                return;
            }

            const materia =
                selectMateria.value;


            if (materia === "") {

                alert(
                    "Escolha uma matéria."
                );

                return;
            }

            salvarMaterial.disabled =
                true;

            try {

                // Envia para o servidor

                await enviarMaterial(
                    arquivoSelecionado,
                    materia
                );

                // Fecha modal

                modalMateria.style.display =
                    "none";

                selectMateria.value =
                    disciplinaSelecionada || "";

                arquivoSelecionado =
                    null;

                fileInput.value =
                    "";

                // Busca novamente no banco

                await carregarMateriais();

                console.log(
                    "Material cadastrado com sucesso!"
                );

            } catch (erro) {

                console.error(
                    "Erro ao cadastrar:",
                    erro
                );

                alert(
                "Não foi possível salvar o material:\n\n" +
                erro.message
    );

            } finally {

                salvarMaterial.disabled =
                    false;

            }

        }
    );

    // add material na tabela de materiais
    function adicionarMaterialNaTabela(
        material
    ) {

        const linha =
            document.createElement(
                "tr"
            );

        // Guarda a matéria
        linha.dataset.materia =
            material.descricao;

        // nome do material
        const colunaNome =
            document.createElement(
                "td"
            );

        colunaNome.textContent =
            material.titulo;

        // conteudo do material
        const colunaConteudo =
            document.createElement(
                "td"
            );

        colunaConteudo.textContent =
            material.descricao;

        // coluna dos botoes
        const colunaBotao =
            document.createElement(
                "td"
            );

        const acoesMaterial =
            document.createElement(
                "div"
            );

        acoesMaterial.classList.add(
            "acoesMaterial"
        );

        // botao baixar
        const botaoBaixar =
            document.createElement(
                "button"
            );

        botaoBaixar.type =
            "button";


        botaoBaixar.textContent =
            "Baixar";


        botaoBaixar.classList.add(
            "botaoBaixar"
        );

        botaoBaixar.addEventListener(
            "click",
            function () {

                baixarMaterial(
                    material
                );

            }
        );

        // botao de excluir
        const botaoExcluir =
            document.createElement(
                "button"
            );

        botaoExcluir.type =
            "button";

        botaoExcluir.textContent =
            "Excluir";

        botaoExcluir.classList.add(
            "botaoExcluir"
        );

        botaoExcluir.addEventListener(
            "click",
            async function () {

                await excluirMaterial(
                    material,
                    linha,
                    botaoExcluir
                );

            }
        );

        // organizacao dos botoes
        acoesMaterial.appendChild(
            botaoBaixar
        );

        acoesMaterial.appendChild(
            botaoExcluir
        );

        colunaBotao.appendChild(
            acoesMaterial
        );

        // monta a linha
        linha.appendChild(
            colunaNome
        );

        linha.appendChild(
            colunaConteudo
        );

        linha.appendChild(
            colunaBotao
        );

        listaMateriais.appendChild(
            linha
        );

        // mantem o filtro
        if (
            materiaFiltrada !== null
        ) {

            linha.style.display =
                material.descricao ===
                materiaFiltrada
                    ? ""
                    : "none";

        }

    }

    // carrega maeriais do banco
    async function carregarMateriais() {

        try {

            const resposta =
                await fetch(
                    "/materiais"
                );

            if (!resposta.ok) {

                throw new Error(
                    "Erro ao buscar materiais"
                );

            }

            const materiais =
                await resposta.json();

            listaMateriais.innerHTML =
                "";

            materiais.forEach(
                function (material) {

                    adicionarMaterialNaTabela(
                        material
                    );

                }
            );

            console.log(
                "Materiais carregados:",
                materiais
            );

        } catch (erro) {

            console.error(
                "Erro ao carregar materiais:",
                erro
            );

            alert(
                "Não foi possível carregar os materiais."
            );

        }

    }

    // baixa materiais
    function baixarMaterial(
        material
    ) {

        const caminhoArquivo =
            "/imagens/materiais/" +
            material.material_arquivo;

        const link =
            document.createElement(
                "a"
            );

        link.href =
            caminhoArquivo;

        link.download =
            material.titulo;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }

    // exclui material
    async function excluirMaterial(
        material,
        linha,
        botaoExcluir
    ) {

        const confirmar =
            confirm(
                "Deseja realmente excluir o material " +
                material.titulo +
                "?"
            );


        if (!confirmar) {

            return;

        }

        botaoExcluir.disabled =
            true;

        try {

            const resposta =
                await fetch(
                    "/materiais/" +
                    material.id_material,
                    {
                        method: "DELETE"
                    }
                );

            if (!resposta.ok) {

                throw new Error(
                    "Erro ao excluir material"
                );

            }

            // remove da tabela
            linha.remove();


            console.log(
                "Material excluído!"
            );

        } catch (erro) {

            console.error(
                "Erro ao excluir:",
                erro
            );


            alert(
                "Não foi possível excluir o material."
            );


            botaoExcluir.disabled =
                false;

        }

    }

    //  filtra materiais ppor assunto
    assuntos.forEach(
        function (assunto) {

            assunto.addEventListener(
                "click",
                function () {

                    const materiaSelecionada =
                        assunto.dataset.materia;


                    // Se clicar novamente,
                    // remove o filtro

                    if (
                        materiaFiltrada ===
                        materiaSelecionada
                    ) {

                        materiaFiltrada =
                            null;

                    } else {

                        materiaFiltrada =
                            materiaSelecionada;

                    }


                    const linhas =
                        listaMateriais.querySelectorAll(
                            "tr"
                        );


                    linhas.forEach(
                        function (linha) {

                            if (
                                materiaFiltrada ===
                                    null ||
                                linha.dataset.materia ===
                                    materiaFiltrada
                            ) {

                                linha.style.display =
                                    "";

                            } else {

                                linha.style.display =
                                    "none";

                            }

                        }
                    );

                }
            );

        }
    );

    // inicializacao
    carregarMateriais();
}

);

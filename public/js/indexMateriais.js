    document.addEventListener("DOMContentLoaded", function () {
    // ELEMENTOS DO HTML

    const btnCadastrar = document.getElementById("btnCadastrar");
    const fileInput = document.getElementById("fileInput");
    const listaMateriais = document.getElementById("listaMateriais");

    const modalMateria = document.getElementById("modalMateria");
    const selectMateria = document.getElementById("selectMateria");
    const salvarMaterial = document.getElementById("salvarMaterial");
    const cancelarMateria = document.getElementById("cancelarMateria");
    const nomeArquivo = document.getElementById("nomeArquivo");

    // VERIFICA SE OS ELEMENTOS EXISTEM

    if (!btnCadastrar) {
        console.error("ERRO: botão #btnCadastrar não encontrado.");
        return;
    }

    if (!fileInput) {
        console.error("ERRO: input #fileInput não encontrado.");
        return;
    }

    // MATERIAL QUE ESTÁ SENDO CADASTRADO

    let arquivoSelecionado = null;

    // ABRIR EXPLORADOR DE ARQUIVOS

    btnCadastrar.addEventListener("click", function () {

        console.log("Botão + clicado!");
        fileInput.click();

    });

    // QUANDO ESCOLHER O ARQUIVO

    fileInput.addEventListener("change", function () {

        if (fileInput.files.length === 0) {
            return;
        }

        arquivoSelecionado = fileInput.files[0];

        console.log("Arquivo escolhido:", arquivoSelecionado.name);


        // Se o modal existir, abre o modal
        if (modalMateria) {

            if (nomeArquivo) {
                nomeArquivo.textContent =
                    "Arquivo: " + arquivoSelecionado.name;
            }
            modalMateria.style.display = "flex";
        }

    });

    // CANCELAR

    if (cancelarMateria) {

        cancelarMateria.addEventListener("click", function () {
            modalMateria.style.display = "none";
            selectMateria.value = "";
            arquivoSelecionado = null;
            fileInput.value = "";

        });

    }

    // SALVAR MATERIAL

    if (salvarMaterial) {

        salvarMaterial.addEventListener("click", function () {

            if (!arquivoSelecionado) {
                alert("Escolha um arquivo primeiro.");
                return;
            }

            const materia = selectMateria.value;

            if (materia === "") {
                alert("Escolha uma matéria.");
                return;
            }

            // SALVA OS DADOS NO LOCALSTORAGE

            let materiais =
                JSON.parse(localStorage.getItem("materiais")) || [];


            const material = {
                nome: arquivoSelecionado.name,
                materia: materia

            };
            materiais.push(material);

            localStorage.setItem(
                "materiais",
                JSON.stringify(materiais)
            );

            // CRIA A LINHA NA TABELA

            adicionarMaterialNaTabela(material);

            // FECHA O MODAL

            modalMateria.style.display = "none";
            selectMateria.value = "";
            arquivoSelecionado = null;
            fileInput.value = "";

        });

    }

    // MOSTRAR MATERIAL NA TABELA

    function adicionarMaterialNaTabela(material) {

        const linha = document.createElement("tr");
        linha.dataset.materia = material.materia;

        const colunaNome = document.createElement("td");
        colunaNome.textContent = material.nome;


        const colunaBotao = document.createElement("td");
        const botaoBaixar = document.createElement("button");

        botaoBaixar.textContent = "Baixar";
        botaoBaixar.classList.add("botaoBaixar");


        colunaBotao.appendChild(botaoBaixar);


        linha.appendChild(colunaNome);
        linha.appendChild(colunaBotao);
        listaMateriais.appendChild(linha);

    }

    // CARREGAR MATERIAIS SALVOS

    function carregarMateriais() {

        const materiais =
            JSON.parse(localStorage.getItem("materiais")) || [];


        materiais.forEach(function (material) {
            adicionarMaterialNaTabela(material);

        });

    }

    // CLICAR NAS MATÉRIAS

    const assuntos =
        document.querySelectorAll("[data-materia]");


    assuntos.forEach(function (assunto) {

        assunto.addEventListener("click", function () {
            const materiaSelecionada =
                assunto.dataset.materia;


            const linhas =
                listaMateriais.querySelectorAll("tr");


            linhas.forEach(function (linha) {

                if (
                    linha.dataset.materia === materiaSelecionada
                ) {
                    linha.style.display = "";
                } else {
                    linha.style.display = "none";

                }

            });
        });
    });

    // CARREGA OS MATERIAIS AO ABRIR

    carregarMateriais();

});
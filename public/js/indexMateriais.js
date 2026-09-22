    document.addEventListener("DOMContentLoaded", function () {
        
    // elementos do html

    const btnCadastrar = document.getElementById("btnCadastrar");
    const fileInput = document.getElementById("fileInput");
    const listaMateriais = document.getElementById("listaMateriais");

    const modalMateria = document.getElementById("modalMateria");
    const selectMateria = document.getElementById("selectMateria");
    const salvarMaterial = document.getElementById("salvarMaterial");
    const cancelarMateria = document.getElementById("cancelarMateria");
    const nomeArquivo = document.getElementById("nomeArquivo");

    // verifica se os coiso existem

    if (!btnCadastrar) {
        console.error("ERRO: botão #btnCadastrar não encontrado.");
        return;
    }

    if (!fileInput) {
        console.error("ERRO: input #fileInput não encontrado.");
        return;
    }

    // material sendo cadastrado

    let arquivoSelecionado = null;

    // abre o explorador de arquivos

    btnCadastrar.addEventListener("click", function () {

        console.log("Botão + clicado!");
        fileInput.click();

    });

    // escolher arquivo

    fileInput.addEventListener("change", function () {

        if (fileInput.files.length === 0) {
            return;
        }

        arquivoSelecionado = fileInput.files[0];

        console.log("Arquivo escolhido:", arquivoSelecionado.name);


        // abre o modal
        if (modalMateria) {

            if (nomeArquivo) {
                nomeArquivo.textContent =
                    "Arquivo: " + arquivoSelecionado.name;
            }
            modalMateria.style.display = "flex";
        }

    });

    // cancelar

    if (cancelarMateria) {

        cancelarMateria.addEventListener("click", function () {
            modalMateria.style.display = "none";
            selectMateria.value = "";
            arquivoSelecionado = null;
            fileInput.value = "";

        });

    }

    // salvar o material

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

            // salva os dados no local storage

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

            // cria uma nova linha na tabela

            adicionarMaterialNaTabela(material);

            // fecha o modal

            modalMateria.style.display = "none";
            selectMateria.value = "";
            arquivoSelecionado = null;
            fileInput.value = "";

        });

    }

    // mostra material na tabela

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

    // carrega materiais salvos

    function carregarMateriais() {

        const materiais =
            JSON.parse(localStorage.getItem("materiais")) || [];

        materiais.forEach(function (material) {
            adicionarMaterialNaTabela(material);

        });

    }

    // clicar nas materias

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

    // carrega os materiais

    carregarMateriais();

});
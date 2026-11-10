
document.addEventListener("DOMContentLoaded", function () {

    // envia o arquivo e as informações do material para o servidor
    async function enviarMaterial(arquivo, materia) {

        const formData = new FormData();

        formData.append("arquivo", arquivo);
        formData.append("titulo", arquivo.name);
        formData.append("descricao", materia);

        const resposta = await fetch("/materiais", {
            method: "POST",
            body: formData
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Erro ao cadastrar material.");
        }

        return resultado;
    }

   
    // SELETOR DE DISCIPLINAS

const seletorDisciplina = document.querySelector(".seletorDisciplina");
const btnDisciplina = document.getElementById("btnDisciplina");
const listaDisciplinas = document.getElementById("listaDisciplinas");

// Abrir e fechar o seletor
if (btnDisciplina && seletorDisciplina) {

    btnDisciplina.addEventListener("click", function (event) {

        event.stopPropagation();

        seletorDisciplina.classList.toggle("aberto");

    });

}

// Buscar disciplinas do banco de dados
async function carregarDisciplinas() {

    if (!listaDisciplinas) return;

    try {

        const resposta = await fetch("/api/disciplinas-paginas");

        if (!resposta.ok) {
            throw new Error("Erro ao consultar as disciplinas.");
        }

        const disciplinas = await resposta.json();

        listaDisciplinas.innerHTML = "";

        disciplinas.forEach(function (disciplina) {

            const botao = document.createElement("button");

            botao.type = "button";
            botao.textContent = disciplina.nome;

            botao.dataset.disciplina = disciplina.nome;
            botao.dataset.rota = disciplina.rota;

            listaDisciplinas.appendChild(botao);

        });

    } catch (erro) {

        console.error("Erro ao carregar disciplinas:", erro);

    }

}

carregarDisciplinas();


// Redirecionar ao selecionar uma disciplina
if (listaDisciplinas) {

    listaDisciplinas.addEventListener("click", function (event) {

        const botao = event.target.closest("button[data-rota]");

        if (!botao) return;

        const rota = botao.dataset.rota;

        if (rota) {

            window.location.href = rota;

        }

    });

}


// Fechar o seletor ao clicar fora dele
document.addEventListener("click", function (event) {

    if (
        seletorDisciplina &&
        !seletorDisciplina.contains(event.target)
    ) {

        seletorDisciplina.classList.remove("aberto");

    }

});

    // identifica a disciplina indicada na url
    const parametrosURL = new URLSearchParams(window.location.search);
    const disciplinaSelecionada = parametrosURL.get("materia");

    // identifica os elementos utilizados no cadastro de materiais
    const btnCadastrar = document.getElementById("btnCadastrar");
    const fileInput = document.getElementById("fileInput");
    const listaMateriais = document.getElementById("listaMateriais");
    const modalMateria = document.getElementById("modalMateria");
    const selectMateria = document.getElementById("selectMateria");
    const salvarMaterial = document.getElementById("salvarMaterial");
    const cancelarMateria = document.getElementById("cancelarMateria");
    const nomeArquivo = document.getElementById("nomeArquivo");

    let arquivoSelecionado = null;
    let materiaFiltrada = disciplinaSelecionada || null;

    // seleciona automaticamente a disciplina indicada na url
    if (disciplinaSelecionada && selectMateria) {

        const opcaoExiste = Array.from(selectMateria.options).some(
            function (opcao) {
                return opcao.value === disciplinaSelecionada;
            }
        );

        if (opcaoExiste) {
            selectMateria.value = disciplinaSelecionada;
        }
    }

    // configura os eventos do cadastro quando os elementos existem
    if (
        btnCadastrar &&
        fileInput &&
        modalMateria &&
        selectMateria &&
        salvarMaterial &&
        cancelarMateria &&
        nomeArquivo
    ) {

        // abre a seleção de arquivos ao clicar no botão de cadastro
        btnCadastrar.addEventListener("click", function () {
            fileInput.click();
        });

        // mostra o arquivo escolhido e abre o modal de cadastro
        fileInput.addEventListener("change", function () {

            if (fileInput.files.length === 0) {
                return;
            }

            arquivoSelecionado = fileInput.files[0];

            nomeArquivo.textContent =
                "Arquivo: " + arquivoSelecionado.name;

            if (disciplinaSelecionada) {
                selectMateria.value = disciplinaSelecionada;
            }

            modalMateria.style.display = "flex";
        });

        // fecha o modal e cancela o cadastro
        cancelarMateria.addEventListener("click", function () {

            modalMateria.style.display = "none";
            selectMateria.value = disciplinaSelecionada || "";
            arquivoSelecionado = null;
            fileInput.value = "";

        });

        // salva o material escolhido pelo usuário
        salvarMaterial.addEventListener("click", async function () {

            if (!arquivoSelecionado) {
                alert("Escolha um arquivo primeiro.");
                return;
            }

            const materia = selectMateria.value;

            if (!materia) {
                alert("Escolha uma matéria.");
                return;
            }

            salvarMaterial.disabled = true;

            try {

                await enviarMaterial(arquivoSelecionado, materia);

                modalMateria.style.display = "none";
                selectMateria.value = disciplinaSelecionada || "";
                arquivoSelecionado = null;
                fileInput.value = "";

                await carregarMateriais();

                alert("Material cadastrado com sucesso!");

            } catch (erro) {

                console.error("Erro ao cadastrar material:", erro);
                alert("Não foi possível salvar o material: " + erro.message);

            } finally {

                salvarMaterial.disabled = false;

            }

        });

    }

    // adiciona um material à tabela de materiais cadastrados
    function adicionarMaterialNaTabela(material) {

        if (!listaMateriais) return;

        const linha = document.createElement("tr");
        linha.dataset.materia = material.descricao;

        const colunaNome = document.createElement("td");
        colunaNome.textContent = material.titulo;

        const colunaConteudo = document.createElement("td");
        colunaConteudo.textContent = material.descricao;

        const colunaAcoes = document.createElement("td");

        const acoesMaterial = document.createElement("div");
        acoesMaterial.classList.add("acoesMaterial");

        // cria o botão para baixar o arquivo
        const botaoBaixar = document.createElement("button");
        botaoBaixar.type = "button";
        botaoBaixar.textContent = "Baixar";
        botaoBaixar.classList.add("botaoBaixar");

        botaoBaixar.addEventListener("click", function () {
            baixarMaterial(material);
        });

        // cria o botão para excluir o material
        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.classList.add("botaoExcluir");

        botaoExcluir.addEventListener("click", async function () {
            await excluirMaterial(material, linha, botaoExcluir);
        });

        acoesMaterial.appendChild(botaoBaixar);
        acoesMaterial.appendChild(botaoExcluir);

        colunaAcoes.appendChild(acoesMaterial);

        linha.appendChild(colunaNome);
        linha.appendChild(colunaConteudo);
        linha.appendChild(colunaAcoes);

        listaMateriais.appendChild(linha);

        // mantém a tabela filtrada pela disciplina selecionada
        if (materiaFiltrada !== null) {

            linha.style.display =
                material.descricao === materiaFiltrada ? "" : "none";

        }
    }

    // busca os materiais cadastrados pelo usuário logado
    async function carregarMateriais() {

        if (!listaMateriais) return;

        try {

            const resposta = await fetch("/materiais/lista");

            if (!resposta.ok) {
                throw new Error("Erro ao buscar materiais.");
            }

            const materiais = await resposta.json();

            listaMateriais.innerHTML = "";

            materiais.forEach(function (material) {
                adicionarMaterialNaTabela(material);
            });

            console.log("Materiais carregados:", materiais);

        } catch (erro) {

            console.error("Erro ao carregar materiais:", erro);
            alert("Não foi possível carregar os materiais.");

        }
    }

    // realiza o download de um material cadastrado
    function baixarMaterial(material) {

        const link = document.createElement("a");

        link.href =
            "/imagens/materiais/" +
            encodeURIComponent(material.material_arquivo);

        link.download = material.titulo;

        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    // exclui o material selecionado
    async function excluirMaterial(material, linha, botaoExcluir) {

        const confirmar = confirm(
            "Deseja realmente excluir o material " +
            material.titulo +
            "?"
        );

        if (!confirmar) return;

        botaoExcluir.disabled = true;

        try {

            const resposta = await fetch(
                "/materiais/" + material.id_material,
                {
                    method: "DELETE"
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Erro ao excluir material.");
            }

            linha.remove();

            console.log("Material excluído com sucesso.");

        } catch (erro) {

            console.error("Erro ao excluir material:", erro);

            alert("Não foi possível excluir o material: " + erro.message);

            botaoExcluir.disabled = false;

        }
    }

    // carrega os materiais assim que a página é aberta
    carregarMateriais();

});


// controla os cliques nos cards e apresenta os materiais compartilhados
document.addEventListener("DOMContentLoaded", function () {

    // identifica os elementos do modal
    const modal = document.getElementById("modalMateriaisCompartilhados");
    const titulo = document.getElementById("tituloModalCompartilhados");
    const lista = document.getElementById("listaMateriaisCompartilhados");

    // abre o modal e busca os materiais do assunto selecionado
    async function abrirModalMateriais(materiaSelecionada) {

        if (!materiaSelecionada) return;

        if (!modal || !titulo || !lista) {
            console.error("Os elementos do modal não foram encontrados.");
            return;
        }

        console.log("Card selecionado:", materiaSelecionada);

        // apresenta o modal antes de carregar os materiais
        modal.style.display = "flex";
        titulo.textContent = materiaSelecionada;

        lista.innerHTML = `
            <p class="carregandoMateriais">
                Carregando materiais...
            </p>
        `;

        try {

            const resposta = await fetch(
                "/materiais/assunto/" +
                encodeURIComponent(materiaSelecionada)
            );

            if (!resposta.ok) {
                throw new Error("Erro ao buscar materiais: " + resposta.status);
            }

            const materiais = await resposta.json();

            lista.innerHTML = "";

            // informa quando não existem materiais para o assunto
            if (!Array.isArray(materiais) || materiais.length === 0) {

                lista.innerHTML = `
                    <p class="semMateriais">
                        Ainda não existem materiais cadastrados neste assunto.
                    </p>
                `;

                return;
            }

            // apresenta cada material encontrado no modal
            materiais.forEach(function (material) {

                const item = document.createElement("div");
                item.classList.add("itemMaterialCompartilhado");

                const informacoes = document.createElement("div");
                informacoes.classList.add("infoMaterialCompartilhado");

                const nome = document.createElement("h4");
                nome.textContent = material.titulo || "Material sem título";

                const descricao = document.createElement("p");
                descricao.textContent = "Assunto: " + (material.descricao || "");

                const autor = document.createElement("p");
                autor.classList.add("autorMaterialCompartilhado");

                autor.textContent =
                    "Cadastrado por: " +
                    (material.autor || "Usuário");

                const data = document.createElement("p");
                data.classList.add("autorMaterialCompartilhado");

                // apresenta a data de publicação do material
                if (material.data_publicacao) {

                    const dataFormatada = new Date(material.data_publicacao);

                    data.textContent =
                        "Publicado em: " +
                        (
                            isNaN(dataFormatada.getTime())
                                ? material.data_publicacao
                                : dataFormatada.toLocaleDateString("pt-BR")
                        );
                }

                informacoes.appendChild(nome);
                informacoes.appendChild(descricao);
                informacoes.appendChild(autor);
                informacoes.appendChild(data);

                // disponibiliza o arquivo para download
                const baixar = document.createElement("a");

                baixar.classList.add("botaoBaixarCompartilhado");
                baixar.textContent = "Baixar";

                baixar.href =
                    "/imagens/materiais/" +
                    encodeURIComponent(material.material_arquivo);

                baixar.download = material.titulo || "material";

                item.appendChild(informacoes);
                item.appendChild(baixar);

                lista.appendChild(item);

            });

        } catch (erro) {

            console.error("Erro ao carregar materiais compartilhados:", erro);

            lista.innerHTML = `
                <p class="semMateriais">
                    Não foi possível carregar os materiais. Tente novamente.
                </p>
            `;

        }
    }

    // identifica o card pela posição real do clique na tela
    document.addEventListener("click", function (event) {

    const elementos = document.elementsFromPoint(
        event.clientX,
        event.clientY
    );

    const assunto = elementos
        .map(function (elemento) {
            return elemento.closest("[data-materia]");
        })
        .find(function (elemento) {
            return elemento && elemento.closest(".atalhos");
        });

    if (!assunto) return;

    console.log("CARD IDENTIFICADO:", assunto.dataset.materia);

    abrirModalMateriais(assunto.dataset.materia);

}, true);

    // fecha o modal de materiais compartilhados
    function fecharModal() {

        if (modal) {
            modal.style.display = "none";
        }

    }

    const botaoFechar = document.getElementById("fecharModalCompartilhados");
    const botaoFechar2 = document.getElementById("fecharModalCompartilhados2");

    if (botaoFechar) {
        botaoFechar.addEventListener("click", fecharModal);
    }

    if (botaoFechar2) {
        botaoFechar2.addEventListener("click", fecharModal);
    }

    // fecha o modal quando o usuário clica no fundo
    if (modal) {

        modal.addEventListener("click", function (event) {

            if (event.target === modal) {
                fecharModal();
            }

        });

    }

    // permite fechar o modal utilizando a tecla esc
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            fecharModal();
        }

    });

});


// controla a movimentação dos cards no carrossel
document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".atalhos").forEach(function (atalhos) {

        const faixa = atalhos.querySelector(".icones");
        const area = atalhos.querySelector(".atalhos1");
        const setas = atalhos.querySelectorAll(".seta");

        if (!faixa || !area || setas.length < 2) return;

        const setaEsquerda = setas[0];
        const setaDireita = setas[1];

        // posiciona as setas nas laterais do carrossel
        atalhos.insertBefore(setaEsquerda, area);
        atalhos.appendChild(setaDireita);

        setaEsquerda.type = "button";
        setaDireita.type = "button";

        setaEsquerda.setAttribute("aria-label", "Conteúdos anteriores");
        setaDireita.setAttribute("aria-label", "Próximos conteúdos");

        // atualiza o estado das setas conforme a posição dos cards
        function atualizarSetas() {

            const limite = faixa.scrollWidth - faixa.clientWidth;

            setaEsquerda.disabled = faixa.scrollLeft <= 1;
            setaDireita.disabled = faixa.scrollLeft >= limite - 1;

        }

        // movimenta o carrossel de acordo com a seta escolhida
        function mover(direcao) {

            const card = faixa.querySelector('[class^="assuntog"]');

            const larguraCard = card
                ? card.getBoundingClientRect().width
                : 152;

            const gap = parseFloat(getComputedStyle(faixa).gap) || 18;

            faixa.scrollBy({
                left: direcao * (larguraCard + gap) * 2,
                behavior: "smooth"
            });

        }

        setaEsquerda.addEventListener("click", function () {
            mover(-1);
        });

        setaDireita.addEventListener("click", function () {
            mover(1);
        });

        // permite arrastar os cards com o mouse
        let pressionado = false;
        let inicioX = 0;
        let scrollInicial = 0;
        let arrastou = false;

        faixa.addEventListener("pointerdown", function (evento) {

            if (evento.pointerType !== "mouse" || evento.button !== 0) {
                return;
            }

            pressionado = true;
            arrastou = false;

            inicioX = evento.clientX;
            scrollInicial = faixa.scrollLeft;

            faixa.classList.add("arrastando");

            faixa.setPointerCapture(evento.pointerId);

        });

        faixa.addEventListener("pointermove", function (evento) {

            if (!pressionado) return;

            const distancia = evento.clientX - inicioX;

            if (Math.abs(distancia) > 4) {
                arrastou = true;
            }

            if (arrastou) {
                faixa.scrollLeft = scrollInicial - distancia;
            }

        });

        // encerra o movimento de arrastar
        function pararArraste() {

            pressionado = false;
            faixa.classList.remove("arrastando");

        }

        faixa.addEventListener("pointerup", pararArraste);
        faixa.addEventListener("pointercancel", pararArraste);
        faixa.addEventListener("lostpointercapture", pararArraste);

        // impede que o movimento de arrastar seja confundido com um clique
        faixa.addEventListener("click", function (evento) {

            if (!arrastou) return;

            evento.preventDefault();
            evento.stopPropagation();

            arrastou = false;

        }, true);

        faixa.addEventListener("scroll", atualizarSetas);
        window.addEventListener("resize", atualizarSetas);

        atualizarSetas();

    });

});

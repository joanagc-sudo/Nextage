
    

    // LISTAS
const container = document.getElementById("containerFiltros");

// Guarda os filtros criados para um poder consultar o outro
const campos = {};

// funçao genérica para filtros
function criarCampoFiltro(config) {

    console.log(config);

    //cria o container
    const campo = document.createElement("div");
    campo.className = "campo-filtro";

    //coloca o html dentro da div
    campo.innerHTML = `
        <label class="form-label">${config.nome}</label>

        <div class="dropdown w-100">

            <button
                type="button"
                class="form-select text-start botao-filtro"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside">
                <span class="texto-selecione">
                    Selecione ${config.nome.toLowerCase()}
                </span>
            </button>

            <ul class="dropdown-menu w-100 p-2">

                <li class="campo-pesquisa">
                    <input
                        type="text"
                        class="form-control pesquisa-filtro"
                        placeholder="Pesquisar..."
                        autocomplete="off">
                </li>

                <li><hr class="dropdown-divider"></li>

                ${config.lista.map(opcao => `
                    <li class="item-filtro"
                    data-disciplina="${opcao.id_disciplina ?? ""}"
                    data-bancas="${(opcao.bancas ?? []).join("||")}"
                    data-bloqueado="false">
                        <div class="form-check">
                            <input
                                class="form-check-input checkbox-filtro"
                                type="${config.tipo ?? "checkbox"}"
                                value="${opcao.id}"
                                data-nome="${opcao.nome}"
                                name="${config.name ?? config.nome}">
                                >
                            <label class="form-check-label">
                                ${opcao.nome}
                            </label>
                        </div>
                    </li>
                `).join("")}

            </ul>
        </div>
    `;

    container.appendChild(campo);

    const botao = campo.querySelector(".botao-filtro");
    const pesquisa = campo.querySelector(".pesquisa-filtro");
    const itens = [...campo.querySelectorAll(".item-filtro")];
    const checkboxes = [...campo.querySelectorAll(".checkbox-filtro")];

    // Retorna os valores (ids) marcados, como string
    function getSelecionados() {
        return checkboxes.filter(c => c.checked).map(c => c.value);
    }

    function atualizarBotao() {
        const nomes = checkboxes
            .filter(c => c.checked)
            .map(c => c.dataset.nome);

        botao.textContent = nomes.length === 0
            ? `Selecione ${config.nome.toLowerCase()}`
            : nomes.join(", ");
    }

    // Combina a pesquisa por texto com o bloqueio por disciplina
    function aplicarVisibilidade() {
        const texto = pesquisa.value.toLowerCase().trim();

        itens.forEach(item => {
            const nome = item.querySelector(".form-check-label")
                .textContent.toLowerCase();

            const passaPesquisa = nome.includes(texto);
            const passaDisciplina = item.dataset.bloqueado !== "true";

            item.style.display = (passaPesquisa && passaDisciplina) ? "" : "none";
        });
    }

    pesquisa.addEventListener("input", aplicarVisibilidade);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            atualizarBotao();
            if (config.onChange) config.onChange();
        });
    });

    return { itens, checkboxes, getSelecionados, atualizarBotao, aplicarVisibilidade };
}

// MOSTRA SÓ OS CONTEÚDOS DAS DISCIPLINAS SELECIONADAS
function filtrarConteudosPorDisciplina() {
    //pega selecionados
    const disciplinasSel = campos.disciplina.getSelecionados();
    const conteudo = campos.conteudo;

    //percorre tds os conteúdos
    conteudo.itens.forEach((item, i) => {
        //pega o checkbos que corresponde
        const checkbox = conteudo.checkboxes[i];

        //verifica se pertence a disciplina selecionada
        const pertence =
            disciplinasSel.length === 0 ||
            disciplinasSel.includes(item.dataset.disciplina);

        item.dataset.bloqueado = pertence ? "false" : "true";

        // Se o dataset está bloqueado, desmarca o checkbox
        if (!pertence && checkbox.checked) {
            checkbox.checked = false;
        }
    });

    conteudo.atualizarBotao();
    conteudo.aplicarVisibilidade();
}

    // MOSTRA SÓ OS ANOS DAS BANCAS SELECIONADAS
function filtrarAnosPorBanca() {

    const bancasSel = campos.banca.getSelecionados();
    const anos = campos.ano;

    anos.itens.forEach((item, i) => {

        const checkbox = anos.checkboxes[i];

        const bancasDoAno = item.dataset.bancas
            ? item.dataset.bancas.split("||")
            : [];

        const pertence =
            bancasSel.length === 0 ||
            bancasSel.some(banca =>
                bancasDoAno.includes(banca)
            );

        item.dataset.bloqueado = pertence ? "false" : "true";

        if (!pertence && checkbox.checked) {
            checkbox.checked = false;
        }
    });

    anos.atualizarBotao();
    anos.aplicarVisibilidade();
}

// CRIAR TODOS OS FILTROS
async function iniciarFiltros() {
    const resp = await fetch("/api/filtros");
    const dados = await resp.json();

    campos.disciplina = criarCampoFiltro({
        nome: "Disciplina",
        name: "disciplina",          // só filtra, a rota ignora
        lista: dados.disciplinas,
        onChange: filtrarConteudosPorDisciplina
    });

    campos.conteudo = criarCampoFiltro({
        nome: "Conteúdo",
        name: "id_conteudo",         // vários permitidos
        lista: dados.conteudos
    });

    campos.banca = criarCampoFiltro({
        nome: "Banca",
        name: "banca",
        tipo: "radio",               // só uma
        lista: dados.bancas,
        onChange: filtrarAnosPorBanca
    });

    campos.ano = criarCampoFiltro({
        nome: "Ano",
        name: "ano",
        tipo: "radio",               // só um
        lista: dados.anos
    });
}

iniciarFiltros();

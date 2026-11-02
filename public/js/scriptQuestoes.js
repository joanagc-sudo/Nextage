// verifica as respostas das questões
document.querySelectorAll(".btn-verificar").forEach(btn => {
    btn.addEventListener("click", async () => {
        const id = btn.dataset.questao;
        const card = btn.closest(".questao");
        const marcada = card.querySelector(`input[name="questao-${id}"]:checked`);
        const resultado = card.querySelector(".resultado");

        resultado.replaceChildren();

        if (!marcada) {
            resultado.textContent = "Selecione uma alternativa.";
            resultado.className = "resultado mt-2 text-warning";
            return;
        }

        const resp = await fetch(`/questoes/${id}/responder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_alternativa: marcada.value })
        });
        const dados = await resp.json();

        // destaca as alternativas
        card.querySelectorAll(".form-check-label")
            .forEach(l => l.classList.remove("text-success", "text-danger", "fw-bold"));

        card.querySelector(`label[for="q${id}-${dados.id_correta}"]`)
            .classList.add("text-success", "fw-bold");

        if (!dados.acertou) {
            card.querySelector(`label[for="${marcada.id}"]`).classList.add("text-danger");
        }

        // exibe o resultado
        const msg = document.createElement("strong");
        msg.className = dados.acertou ? "text-success" : "text-danger";
        msg.textContent = dados.acertou ? "Acertou!" : "Errou.";
        resultado.className = "resultado mt-2";
        resultado.append(msg);

        // exibe a explicação
        if (dados.explicacao) {
            const p = document.createElement("p");
            p.className = "mt-2 mb-0";
            p.textContent = dados.explicacao;
            resultado.append(p);
        }
    });
});


// listas de filtros


// seleciona o container
const container = document.getElementById("containerFiltros");

// armazena os filtros criados
const campos = {};

// cria os campos de filtro
function criarCampoFiltro(config) {

    console.log(config);

    // cria o container do campo
    const campo = document.createElement("div");
    campo.className = "campo-filtro";

    // adiciona o html do filtro
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
                                type="checkbox"
                                value="${opcao.id}"
                                data-nome="${opcao.nome}"
                                name="${config.nome}">
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

    // retorna os ids selecionados
    function getSelecionados() {
        return checkboxes.filter(c => c.checked).map(c => c.value);
    }

    // atualiza o texto do botão
    function atualizarBotao() {
        const nomes = checkboxes
            .filter(c => c.checked)
            .map(c => c.dataset.nome);

        botao.textContent = nomes.length === 0
            ? `Selecione ${config.nome.toLowerCase()}`
            : nomes.join(", ");
    }

    // aplica os filtros de pesquisa e bloqueio
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

    // filtra os itens digitados
    pesquisa.addEventListener("input", aplicarVisibilidade);

    // atualiza o filtro ao selecionar
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            atualizarBotao();
            if (config.onChange) config.onChange();
        });
    });

    return { itens, checkboxes, getSelecionados, atualizarBotao, aplicarVisibilidade };
}


// filtra os conteúdos por disciplina
function filtrarConteudosPorDisciplina() {

    const disciplinasSel = campos.disciplina.getSelecionados();
    const conteudo = campos.conteudo;

    // verifica cada conteúdo
    conteudo.itens.forEach((item, i) => {
        const checkbox = conteudo.checkboxes[i];

        // verifica se pertence à disciplina
        const pertence =
            disciplinasSel.length === 0 ||
            disciplinasSel.includes(item.dataset.disciplina);

        item.dataset.bloqueado = pertence ? "false" : "true";

        // desmarca conteúdos bloqueados
        if (!pertence && checkbox.checked) {
            checkbox.checked = false;
        }
    });

    conteudo.atualizarBotao();
    conteudo.aplicarVisibilidade();
}


// filtra os anos por banca
function filtrarAnosPorBanca() {

    const bancasSel = campos.banca.getSelecionados();
    const anos = campos.ano;

    anos.itens.forEach((item, i) => {

        const checkbox = anos.checkboxes[i];

        // obtém as bancas relacionadas ao ano
        const bancasDoAno = item.dataset.bancas
            ? item.dataset.bancas.split("||")
            : [];

        // verifica se pertence à banca
        const pertence =
            bancasSel.length === 0 ||
            bancasSel.some(banca =>
                bancasDoAno.includes(banca)
            );

        item.dataset.bloqueado = pertence ? "false" : "true";

        // desmarca anos bloqueados
        if (!pertence && checkbox.checked) {
            checkbox.checked = false;
        }
    });

    anos.atualizarBotao();
    anos.aplicarVisibilidade();
}


// inicializa todos os filtros
async function iniciarFiltros() {
    const resp = await fetch("/api/filtros");
    const dados = await resp.json();

    // cria o filtro de disciplinas
    campos.disciplina = criarCampoFiltro({
        nome: "Disciplina",
        lista: dados.disciplinas,
        onChange: filtrarConteudosPorDisciplina
    });

    // cria o filtro de conteúdos
    campos.conteudo = criarCampoFiltro({
        nome: "Conteúdo",
        lista: dados.conteudos
    });

    // cria o filtro de bancas
    campos.banca = criarCampoFiltro({
        nome: "Banca",
        lista: dados.bancas,
        onChange: filtrarAnosPorBanca
    });

    // cria o filtro de anos
    campos.ano = criarCampoFiltro({
        nome: "Ano",
        lista: dados.anos
    });
}

iniciarFiltros();
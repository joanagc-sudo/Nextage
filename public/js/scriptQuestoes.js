
    // Javascript para verificar questões corretas
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

            // Limpa marcações anteriores e destaca correta/errada
            card.querySelectorAll(".form-check-label")
                .forEach(l => l.classList.remove("text-success", "text-danger", "fw-bold"));

            card.querySelector(`label[for="q${id}-${dados.id_correta}"]`)
                .classList.add("text-success", "fw-bold");

            if (!dados.acertou) {
                card.querySelector(`label[for="${marcada.id}"]`).classList.add("text-danger");
            }

            const msg = document.createElement("strong");
            msg.className = dados.acertou ? "text-success" : "text-danger";
            msg.textContent = dados.acertou ? "Acertou!" : "Errou.";
            resultado.className = "resultado mt-2";
            resultado.append(msg);

            if (dados.explicacao) {
                const p = document.createElement("p");
                p.className = "mt-2 mb-0";
                p.textContent = dados.explicacao;
                resultado.append(p);
            }
        });
    });


    // LISTAS



    // CONTAINER
const container = document.getElementById("containerFiltros");

// Guarda os filtros criados para um poder consultar o outro
const campos = {};

// FUNÇÃO GENÉRICA
function criarCampoFiltro(config) {

    const campo = document.createElement("div");
    campo.className = "campo-filtro";

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
                        data-bloqueado="false">
                        <div class="form-check">
                            <input
                                class="form-check-input checkbox-filtro"
                                type="checkbox"
                                value="${opcao.id}"
                                data-nome="${opcao.nome}">
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
    const disciplinasSel = campos.disciplina.getSelecionados();
    const conteudo = campos.conteudo;

    conteudo.itens.forEach((item, i) => {
        const checkbox = conteudo.checkboxes[i];

        const pertence =
            disciplinasSel.length === 0 ||
            disciplinasSel.includes(item.dataset.disciplina);

        item.dataset.bloqueado = pertence ? "false" : "true";

        // Se o conteúdo saiu da lista, desmarca
        if (!pertence && checkbox.checked) {
            checkbox.checked = false;
        }
    });

    conteudo.atualizarBotao();
    conteudo.aplicarVisibilidade();
}

// CRIAR TODOS OS FILTROS
async function iniciarFiltros() {
    const resp = await fetch("/api/filtros");
    const dados = await resp.json();

    campos.disciplina = criarCampoFiltro({
        nome: "Disciplina",
        lista: dados.disciplinas,
        onChange: filtrarConteudosPorDisciplina
    });

    campos.conteudo = criarCampoFiltro({
        nome: "Conteúdo",
        lista: dados.conteudos
    });

    campos.banca = criarCampoFiltro({
        nome: "Banca",
        lista: dados.bancas
    });

    campos.ano = criarCampoFiltro({
        nome: "Ano",
        lista: dados.anos
    });
}

iniciarFiltros();
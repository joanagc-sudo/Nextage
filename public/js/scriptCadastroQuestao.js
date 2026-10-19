const container = document.getElementById("containerFiltros");

// Guarda os filtros criados (chave = atributo name do campo)
const campos = {};

function escapar(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/*
config = {
    nome: "Vestibular",          // texto exibido
    name: "id_vestibular",       // name enviado no formulário
    multiplo: false,             // false = escolha única
    obrigatorio: true,
    lista: [{ id, nome, id_disciplina? }],
    onChange: () => {}
}
*/
function criarCampoFiltro(config) {

    const multiplo = config.multiplo ?? true;
    const tipoInput = multiplo ? "checkbox" : "radio";

    const campo = document.createElement("div");
    campo.className = "campo-filtro";

    campo.innerHTML = `
        <label class="form-label">${escapar(config.nome)}</label>

        <div class="dropdown w-100">
            <button
                type="button"
                class="form-select text-start botao-filtro"
                data-bs-toggle="dropdown"
                data-bs-auto-close="${multiplo ? "outside" : "true"}">
                Selecione ${escapar(config.nome.toLowerCase())}
            </button>

            <ul class="dropdown-menu w-100 p-2">
                <li class="campo-pesquisa">
                    <input type="text" class="form-control pesquisa-filtro"
                           placeholder="Pesquisar..." autocomplete="off">
                </li>
                <li><hr class="dropdown-divider"></li>

                ${config.lista.map(opcao => `
                    <li class="item-filtro"
                        data-disciplina="${opcao.id_disciplina ?? ""}"
                        data-bloqueado="false">
                        <div class="form-check">
                            <input
                                class="form-check-input checkbox-filtro"
                                type="${tipoInput}"
                                value="${escapar(opcao.id)}"
                                data-nome="${escapar(opcao.nome)}"
                                name="${escapar(config.name)}">
                            <label class="form-check-label">
                                ${escapar(opcao.nome)}
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

    function getSelecionados() {
        return checkboxes.filter(c => c.checked).map(c => c.value);
    }

    function atualizarBotao() {
        const nomes = checkboxes.filter(c => c.checked).map(c => c.dataset.nome);
        botao.textContent = nomes.length === 0
            ? `Selecione ${config.nome.toLowerCase()}`
            : nomes.join(", ");
    }

    function aplicarVisibilidade() {
        const texto = pesquisa.value.toLowerCase().trim();
        itens.forEach(item => {
            const nome = item.querySelector(".form-check-label").textContent.toLowerCase();
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

    const campoCriado = {
        itens, checkboxes, getSelecionados, atualizarBotao, aplicarVisibilidade,
        obrigatorio: config.obrigatorio ?? false,
        nome: config.nome
    };

    campos[config.name] = campoCriado;
    return campoCriado;
}

// ---------- Carrega os dados do banco e cria os filtros ----------
async function iniciar() {
    try {
        const [vestibulares, conteudos] = await Promise.all([
            fetch("/api/vestibulares").then(r => r.json()),
            fetch("/api/conteudos").then(r => r.json())
        ]);

        criarCampoFiltro({
            nome: "Vestibular",
            name: "id_vestibular",
            multiplo: false,
            obrigatorio: true,
            lista: vestibulares
        });

        criarCampoFiltro({
            nome: "Conteúdo",
            name: "id_conteudo",
            multiplo: true,
            obrigatorio: true,
            lista: conteudos
        });
    } catch (err) {
        console.error(err);
        container.textContent = "Erro ao carregar vestibulares e conteúdos.";
    }
}

iniciar();

// ---------- Validação antes de enviar ----------
document.querySelector("form").addEventListener("submit", e => {

    for (const campo of Object.values(campos)) {
        if (campo.obrigatorio && campo.getSelecionados().length === 0) {
            e.preventDefault();
            alert(`Selecione pelo menos um(a) ${campo.nome.toLowerCase()}.`);
            return;
        }
    }

    const form = e.target;
    const obrigatorios = ["nameEnunciado", "nameA", "nameB", "nameC", "nameD", "nameE", "nameAlt"];

    for (const nome of obrigatorios) {
        if (!form.elements[nome].value.trim()) {
            e.preventDefault();
            alert("Preencha o enunciado, as 5 alternativas e a alternativa correta.");
            form.elements[nome].focus();
            return;
        }
    }
});
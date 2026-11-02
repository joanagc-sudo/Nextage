(function () {

    const ID_QUESTAO = window.location.pathname.split("/").filter(Boolean).pop();

    const container = document.getElementById("containerFiltros");

    const campos = {};

    let dadosFiltros;

    // criar um filtro
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
                            data-bancas="${(opcao.bancas ?? []).join("||")}"
                            data-bloqueado="false">
                            <div class="form-check">
                                <input
                                    class="form-check-input checkbox-filtro"
                                    type="${config.tipo ?? "checkbox"}"
                                    value="${opcao.id}"
                                    data-nome="${opcao.nome}"
                                    name="${config.name ?? config.nome}">
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

        // retorna ids marcados como string
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

        //pesquisa por texto com o bloqueio por disciplina/banca
        function aplicarVisibilidade() {
            const texto = pesquisa.value.toLowerCase().trim();

            itens.forEach(item => {
                const nome = item.querySelector(".form-check-label")
                    .textContent.toLowerCase();

                const passaPesquisa = nome.includes(texto);
                const passaBloqueio = item.dataset.bloqueado !== "true";

                item.style.display = (passaPesquisa && passaBloqueio) ? "" : "none";
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

    // conteúdos das disciplinas selecionadas
    function filtrarConteudosPorDisciplina() {
        const disciplinasSel = campos.disciplina.getSelecionados();
        const conteudo = campos.conteudo;

        conteudo.itens.forEach((item, i) => {
            const checkbox = conteudo.checkboxes[i];

            const pertence =
                disciplinasSel.length === 0 ||
                disciplinasSel.includes(item.dataset.disciplina);

            item.dataset.bloqueado = pertence ? "false" : "true";

            if (!pertence && checkbox.checked) {
                checkbox.checked = false;
            }
        });

        conteudo.atualizarBotao();
        conteudo.aplicarVisibilidade();
    }

    // mostra só os anos das bancas selecionadas
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
                bancasSel.some(banca => bancasDoAno.includes(banca));

            item.dataset.bloqueado = pertence ? "false" : "true";

            if (!pertence && checkbox.checked) {
                checkbox.checked = false;
            }
        });

        anos.atualizarBotao();
        anos.aplicarVisibilidade();
    }

    //marca no filtro os valores informados 
    function marcar(campo, valores) {
        const lista = valores.map(String);

        campo.checkboxes.forEach(c => {
            c.checked = lista.includes(c.value);
        });

        campo.atualizarBotao();
    }

    // preenche o formulário com a questão
    async function preencherQuestao() {
        const resp = await fetch(`/api/questoes-admin/${ID_QUESTAO}`);

        if (!resp.ok) {
            console.error("Falha ao buscar questão. Status:", resp.status);
            alert("Questão não encontrada");
            return;
        }

        const q = await resp.json();
        console.log("Questão carregada:", q);

        document.querySelector("[name=enunciado]").value = q.enunciado;
        document.querySelector("[name=correta]").value = q.correta;

        for (const letra of ["a", "b", "c", "d", "e"]) {
            document.querySelector(`[name=alt_${letra}]`).value =
                q.alternativas[letra] ?? "";
        }

        const aviso = document.getElementById("avisoImagem");
        if (q.tem_imagem && aviso) aviso.classList.remove("d-none");

        // Disciplinas = disciplinas dos conteúdos da questão
        const disciplinas = [...new Set(
            dadosFiltros.conteudos
                .filter(c => q.conteudos.includes(String(c.id)))
                .map(c => String(c.id_disciplina))
        )];

        // s filtros desmarcam o que está bloqueado
        marcar(campos.disciplina, disciplinas);
        filtrarConteudosPorDisciplina();
        marcar(campos.conteudo, q.conteudos);

        marcar(campos.banca, [q.banca]);
        filtrarAnosPorBanca();
        marcar(campos.ano, [q.ano]);
    }

    // cria todos os filtros e preenche a questão
    async function iniciarFiltros() {
        try {
            const resp = await fetch("/api/filtros");

            if (!resp.ok) {
                console.error("Falha em /api/filtros. Status:", resp.status);
                return;
            }

            dadosFiltros = await resp.json();
            const dados = dadosFiltros;

            campos.disciplina = criarCampoFiltro({
                nome: "Disciplina",
                name: "disciplina",
                lista: dados.disciplinas,
                onChange: filtrarConteudosPorDisciplina
            });

            campos.conteudo = criarCampoFiltro({
                nome: "Conteúdo",
                name: "id_conteudo",
                lista: dados.conteudos
            });

            campos.banca = criarCampoFiltro({
                nome: "Banca",
                name: "banca",
                tipo: "radio",
                lista: dados.bancas,
                onChange: filtrarAnosPorBanca
            });

            campos.ano = criarCampoFiltro({
                nome: "Ano",
                name: "ano",
                tipo: "radio",
                lista: dados.anos
            });

            await preencherQuestao();

        } catch (err) {
            console.error("Erro ao iniciar a página de alteração:", err);
        }
    }
 // Excluir questão
document.getElementById("btnExcluir").addEventListener("click", async () => {

    const confirmar = confirm(
        "Tem certeza que deseja excluir esta questão? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {

        const resp = await fetch(`/api/questoes-admin/${ID_QUESTAO}`, {
            method: "DELETE"
        });

        if (!resp.ok) {
            const erro = await resp.text();
            alert(erro);
            return;
        }

        alert("Questão excluída com sucesso!");

        window.location.href = "/cadastro-questoes";

    } catch (err) {

        console.error(err);
        alert("Erro ao excluir questão.");

    }

});
    iniciarFiltros();

})();
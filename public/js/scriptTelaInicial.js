document.addEventListener("DOMContentLoaded", () => {

const abrir = document.getElementById("abrirLembrete");
const novo = document.getElementById("novoLembrete");
const input = document.getElementById("textoLembrete");
const salvar = document.getElementById("salvarLembrete");
const lista = document.getElementById("listaLembretes");

// Carrega os lembretes salvos no banco.
async function carregarLembretes() {
    if (!lista) return;

    try {
        const resposta = await fetch("/api/lembretes");

        if (resposta.status === 401) {
            lista.replaceChildren();
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os lembretes.");
        }

        const dados = await resposta.json();
        lista.replaceChildren();

        dados.lembretes.forEach(criarItemLembrete);

    } catch (erro) {
        console.error("Erro ao carregar lembretes:", erro);
    }
}

function criarItemLembrete(lembrete) {
    const item = document.createElement("div");
    item.className = "item-lembrete";
    item.dataset.id = lembrete.id_lembrete;

    const texto = document.createElement("span");
    texto.textContent = lembrete.texto;

    const apagar = document.createElement("button");
    apagar.type = "button";
    apagar.className = "apagar";
    apagar.setAttribute("aria-label", "Excluir lembrete");
    apagar.innerHTML = '<i class="bi bi-trash"></i>';

    apagar.addEventListener("click", async () => {
        if (!confirm("Deseja excluir este lembrete?")) return;

        apagar.disabled = true;

        try {
            const resposta = await fetch(
                `/api/lembretes/${lembrete.id_lembrete}`,
                { method: "DELETE" }
            );

            const resultado = await resposta.json();

            if (resposta.status === 401) {
                alert("Sua sessão expirou. Faça login novamente.");
                window.location.href = "/tela-login";
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível excluir."
                );
            }

            item.remove();

        } catch (erro) {
            console.error("Erro ao excluir lembrete:", erro);
            alert(erro.message);
            apagar.disabled = false;
        }
    });

    item.append(texto, apagar);
    lista.appendChild(item);
}

// Abre e fecha o campo de adicionar.
if (abrir && novo && input && salvar && lista) {
    abrir.addEventListener("click", () => {
        const aberto = novo.style.display === "flex";
        novo.style.display = aberto ? "none" : "flex";

        if (!aberto) input.focus();
    });

    // Salva primeiro no banco; depois exibe na tela.
    async function adicionarLembrete() {
        const texto = input.value.trim();

        if (!texto) {
            input.focus();
            return;
        }

        //so pra ter certeza w ta cerrto
        if (texto.length > 500) {
            alert("O lembrete deve ter no máximo 500 caracteres.");
            return;
        }

        salvar.disabled = true;

        try {
            const resposta = await fetch("/api/lembretes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ texto })
            });

            const resultado = await resposta.json();

            if (resposta.status === 401) {
                alert("Faça login para salvar seus lembretes.");
                window.location.href = "/tela-login";
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível salvar."
                );
            }

            criarItemLembrete(resultado.lembrete);

            input.value = "";
            novo.style.display = "none";

        } catch (erro) {
            console.error("Erro ao salvar lembrete:", erro);
            alert(erro.message);

        } finally {
            salvar.disabled = false;
        }
    }

    salvar.addEventListener("click", adicionarLembrete);

    input.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            adicionarLembrete();
        }
    });

    carregarLembretes();
}

    async function carregarCronogramaInicial() {
        const container = document.getElementById("conteudoCronograma");

        if (!container) {
            console.error(
                'Não foi encontrado o elemento com id "conteudoCronograma".'
            );
            return;
        }

        try {
            const resposta = await fetch("/api/cronograma");

            if (resposta.status === 401) {
                mostrarMensagem(
                    "Faça login para visualizar seus cronogramas."
                );
                return;
            }

            if (!resposta.ok) {
                throw new Error("Erro ao buscar cronograma.");
            }

            const dados = await resposta.json();
            const cronograma = dados.cronograma;

            container.replaceChildren();

            // Se o usuário ainda não salvou um cronograma.
            if (!cronograma) {
                const titulo = document.createElement("h3");
                titulo.textContent = "Ainda não há nada por aqui...";

                const texto = document.createElement("p");
                texto.textContent =
                    'Seus cronogramas criados aparecerão aqui. Clique em "Começar a estudar" e inicie seus estudos!';

                container.append(titulo, texto);
                return;
            }

            const dias = [
                ["segunda", "Segunda-feira"],
                ["terca", "Terça-feira"],
                ["quarta", "Quarta-feira"],
                ["quinta", "Quinta-feira"],
                ["sexta", "Sexta-feira"],
                ["sabado", "Sábado"],
                ["domingo", "Domingo"]
            ];

            const titulo = document.createElement("h3");
            titulo.textContent = "Seu cronograma de estudos";
            container.appendChild(titulo);

            // Cria a tabela.
            const tabela = document.createElement("table");
            tabela.className = "tabela-resumo-cronograma";

            // Cabeçalho com os dias da semana.
            const cabecalho = document.createElement("thead");
            const linhaCabecalho = document.createElement("tr");

            dias.forEach(([chave, nome]) => {
                const th = document.createElement("th");
                th.textContent = nome;
                linhaCabecalho.appendChild(th);
            });

            cabecalho.appendChild(linhaCabecalho);

            // Linha com as atividades de cada dia.
            const corpo = document.createElement("tbody");
            const linhaAtividades = document.createElement("tr");

            dias.forEach(([chave]) => {
                const td = document.createElement("td");
                const atividade = cronograma[chave];

                td.textContent =
                    atividade && atividade.trim()
                        ? atividade
                        : "—";

                linhaAtividades.appendChild(td);
            });

            corpo.appendChild(linhaAtividades);
            tabela.append(cabecalho, corpo);

            // Permite rolagem horizontal em telas menores.
            const wrapper = document.createElement("div");
            wrapper.className = "tabela-resumo-container";
            wrapper.appendChild(tabela);

            container.appendChild(wrapper);

            // Botão para abrir e editar o cronograma.
            const link = document.createElement("a");
            link.href = "/cronograma";
            link.className = "botao-cronograma";
            link.textContent = "Ver cronograma";

            container.appendChild(link);

        } catch (erro) {
            console.error("Erro ao carregar cronograma:", erro);

            mostrarMensagem(
                "Não foi possível carregar seu cronograma. Tente novamente."
            );
        }

        function mostrarMensagem(texto) {
            container.replaceChildren();

            const mensagem = document.createElement("p");
            mensagem.textContent = texto;

            container.appendChild(mensagem);
        }
    }

    // Carrega o cronograma ao abrir a tela inicial.
    carregarCronogramaInicial();

});
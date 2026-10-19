document.addEventListener("DOMContentLoaded", () => {

    const abrir = document.getElementById("abrirLembrete");
    const novo = document.getElementById("novoLembrete");
    const inputLembrete = document.getElementById("textoLembrete");
    const salvarLembrete = document.getElementById("salvarLembrete");
    const listaLembretes = document.getElementById("listaLembretes");

    if (abrir && novo && inputLembrete && salvarLembrete && listaLembretes) {

        abrir.addEventListener("click", () => {
            const aberto = novo.style.display === "flex";

            novo.style.display = aberto ? "none" : "flex";

            if (!aberto) {
                inputLembrete.focus();
            }
        });

        salvarLembrete.addEventListener("click", adicionarLembrete);

        inputLembrete.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") {
                adicionarLembrete();
            }
        });

        function adicionarLembrete() {
            const texto = inputLembrete.value.trim();

            if (!texto) {
                inputLembrete.focus();
                return;
            }

            const item = document.createElement("div");
            item.className = "item-lembrete";

            const textoElemento = document.createElement("span");
            textoElemento.textContent = texto;

            const botaoApagar = document.createElement("button");
            botaoApagar.type = "button";
            botaoApagar.className = "apagar";
            botaoApagar.setAttribute("aria-label", "Apagar lembrete");
            botaoApagar.innerHTML = '<i class="bi bi-trash"></i>';

            botaoApagar.addEventListener("click", () => {
                item.remove();
            });

            item.append(textoElemento, botaoApagar);
            listaLembretes.appendChild(item);

            inputLembrete.value = "";
            novo.style.display = "none";
        }
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
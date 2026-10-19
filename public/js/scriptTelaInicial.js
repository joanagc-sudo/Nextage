
    const abrir = document.getElementById("abrirLembrete");
    const novo = document.getElementById("novoLembrete");
    const input = document.getElementById("textoLembrete");
    const salvar = document.getElementById("salvarLembrete");
    const lista = document.getElementById("listaLembretes");

    abrir.addEventListener("click", () => {
        if (novo.style.display === "flex") {
            novo.style.display = "none";
        } else {
            novo.style.display = "flex";
            input.focus();
        }
    });

    salvar.addEventListener("click", adicionarLembrete);

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            adicionarLembrete();
        }
    });

    function adicionarLembrete() {

        const texto = input.value.trim();

        if (texto === "") return;

        const item = document.createElement("div");
        item.className = "item-lembrete";

        item.innerHTML = `
            <span>${texto}</span>
            <button class="apagar">
                <i class="bi bi-trash"></i>
            </button>
        `;

        item.querySelector(".apagar").addEventListener("click", () => {
            item.remove();
        });

        lista.appendChild(item);

        input.value = "";
        novo.style.display = "none";
    }
async function carregarCronogramaInicial() {
    const container = document.getElementById("conteudoCronograma");

    if (!container) return;

    try {
        const resposta = await fetch("/api/cronograma");

        if (!resposta.ok) {
            if (resposta.status === 401) {
                container.replaceChildren();

                const mensagem = document.createElement("p");
                mensagem.textContent = "Faça login para visualizar seus cronogramas.";
                container.appendChild(mensagem);
                return;
            }

            throw new Error("Erro ao buscar cronograma.");
        }

        const dados = await resposta.json();
        container.replaceChildren();

        if (!dados.cronograma) {
            const titulo = document.createElement("h3");
            titulo.textContent = "Ainda não há nada por aqui...";

            const texto = document.createElement("p");
            texto.textContent =
                'Seus cronogramas criados aparecerão aqui. Clique em "Começar a estudar" e inicie seus estudos!';

            container.append(titulo, texto);
            return;
        }

        const cronograma = dados.cronograma;

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

        const lista = document.createElement("div");
        lista.className = "resumo-cronograma";

        dias.forEach(([chave, nome]) => {
            const atividade = cronograma[chave];

            if (!atividade) return;

            const item = document.createElement("p");
            const dia = document.createElement("strong");

            dia.textContent = nome + ": ";
            item.append(dia, document.createTextNode(atividade));
            lista.appendChild(item);
        });

        if (!lista.hasChildNodes()) {
            const texto = document.createElement("p");
            texto.textContent = "Seu cronograma ainda não tem atividades.";
            lista.appendChild(texto);
        }

        container.appendChild(lista);

        const link = document.createElement("a");
        link.href = "/cronograma";
        link.className = "botao";
        link.textContent = "Ver cronograma";
        container.appendChild(link);

    } catch (erro) {
        console.error("Erro ao carregar cronograma:", erro);

        container.replaceChildren();

        const mensagem = document.createElement("p");
        mensagem.textContent =
            "Não foi possível carregar seu cronograma. Tente novamente.";

        container.appendChild(mensagem);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    carregarCronogramaInicial
);

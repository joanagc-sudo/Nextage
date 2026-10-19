document.addEventListener("DOMContentLoaded", () => {
    const btnEditar = document.getElementById("btnEditar");
    const btnExcluir = document.getElementById("btnExcluir");
    const btnSalvar = document.getElementById("btnSalvar");
    const btnVoltar = document.getElementById("btnVoltar");

    const celulas = document.querySelectorAll(
        ".tabela-cronograma tbody td"
    );

    // Ordem das colunas: segunda até domingo.
    const diasVisuais = [
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "domingo"
    ];

    let editando = false;
    let celulaSelecionada = null;

    // Verifica se os elementos necessários existem.
    if (
        !btnEditar ||
        !btnExcluir ||
        !btnSalvar ||
        !btnVoltar ||
        celulas.length !== 7
    ) {
        console.error(
            "Verifique os IDs dos botões e a tabela do cronograma."
        );
        return;
    }

    // Carrega o cronograma salvo no banco de dados.
    async function carregarCronograma() {
        try {
            const resposta = await fetch("/api/cronograma");

            if (resposta.status === 401) {
                alert("Faça login para acessar seu cronograma.");
                window.location.href = "/tela-login";
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível carregar o cronograma."
                );
            }

            const dados = await resposta.json();
            const cronograma = dados.cronograma;

            celulas.forEach((celula, indice) => {
                celula.textContent = cronograma
                    ? cronograma[diasVisuais[indice]] || ""
                    : "";

                celula.contentEditable = editando;
                celula.classList.remove("celula-selecionada");
            });

            celulaSelecionada = null;

        } catch (erro) {
            console.error("Erro ao carregar cronograma:", erro);
            alert(erro.message);
        }
    }

    // Ativa ou finaliza a edição.
    btnEditar.addEventListener("click", () => {
        editando = !editando;

        celulas.forEach(celula => {
            celula.contentEditable = editando;
            celula.classList.remove("celula-selecionada");
        });

        celulaSelecionada = null;

        btnEditar.textContent = editando
            ? "Finalizar edição"
            : "Editar";
    });

    // Seleciona uma célula durante a edição.
    celulas.forEach(celula => {
        celula.addEventListener("click", () => {
            if (!editando) return;

            celulas.forEach(item => {
                item.classList.remove("celula-selecionada");
            });

            celulaSelecionada = celula;
            celula.classList.add("celula-selecionada");
        });
    });

    // Exclui a atividade selecionada.
    btnExcluir.addEventListener("click", () => {
        if (!editando) {
            alert("Clique em Editar antes de excluir uma atividade.");
            return;
        }

        if (!celulaSelecionada) {
            alert("Selecione uma atividade para excluir.");
            return;
        }

        celulaSelecionada.textContent = "";
        celulaSelecionada.classList.remove("celula-selecionada");
        celulaSelecionada = null;
    });

    // Salva o cronograma no banco de dados.
    btnSalvar.addEventListener("click", async () => {
        const cronograma = {};

        celulas.forEach((celula, indice) => {
            cronograma[diasVisuais[indice]] =
                celula.innerText.trim();
        });

        try {
            btnSalvar.disabled = true;

            const resposta = await fetch("/api/cronograma", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(cronograma)
            });

            if (resposta.status === 401) {
                alert("Sua sessão expirou. Faça login novamente.");
                window.location.href = "/tela-login";
                return;
            }

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível salvar."
                );
            }

            alert("Cronograma salvo com sucesso!");

            // Atualiza os dados com a resposta do servidor.
            await carregarCronograma();

        } catch (erro) {
            console.error("Erro ao salvar cronograma:", erro);

            alert(
                erro.message || "Não foi possível salvar o cronograma."
            );
        } finally {
            btnSalvar.disabled = false;
        }
    });

    // Volta para a tela inicial.
    btnVoltar.addEventListener("click", () => {
        window.location.href = "/tela-inicial";
    });

    // Carrega os dados ao abrir a página.
    carregarCronograma();
});
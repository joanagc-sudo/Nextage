
const btnEditar = document.getElementById("btnEditar");
const btnExcluir = document.getElementById("btnExcluir");
const btnSalvar = document.getElementById("btnSalvar");
const btnVoltar = document.getElementById("btnVoltar");

const celulas = document.querySelectorAll(
    ".tabela-cronograma tbody td"
);

// A ordem visual da tabela é segunda até domingo.
const diasVisuais = [
    "segunda", "terca", "quarta",
    "quinta", "sexta", "sabado", "domingo"
];

let editando = false;
let celulaSelecionada = null;

// Carregar os dados que já estão salvos
async function carregarCronograma() {
    try {
        const resposta = await fetch("/api/cronograma");

        if (!resposta.ok) {
            if (resposta.status === 401) {
                alert("Faça login para acessar seu cronograma.");
                window.location.href = "/tela-login";
                return;
            }

            throw new Error("Erro ao buscar cronograma.");
        }

        const dados = await resposta.json();
        const cronograma = dados.cronograma;

        if (cronograma) {
            celulas.forEach((celula, indice) => {
                celula.textContent =
                    cronograma[diasVisuais[indice]] || "";
            });
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar o cronograma.");
    }
}

btnEditar.addEventListener("click", () => {
    editando = !editando;

    celulas.forEach(celula => {
        celula.contentEditable = editando;
    });

    btnEditar.textContent = editando
        ? "Finalizar edição"
        : "Editar";
});

celulas.forEach(celula => {
    celula.addEventListener("click", () => {
        if (!editando) return;

        celulas.forEach(item =>
            item.classList.remove("celula-selecionada")
        );

        celulaSelecionada = celula;
        celula.classList.add("celula-selecionada");
    });
});

btnExcluir.addEventListener("click", () => {
    if (!celulaSelecionada) {
        alert("Selecione uma atividade para excluir.");
        return;
    }

    celulaSelecionada.textContent = "";
    celulaSelecionada.classList.remove("celula-selecionada");
    celulaSelecionada = null;
});

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

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Erro ao salvar."
            );
        }

        alert("Cronograma salvo com sucesso!");
    } catch (erro) {
        console.error(erro);
        alert(erro.message || "Não foi possível salvar.");
    } finally {
        btnSalvar.disabled = false;
    }
});

btnVoltar.addEventListener("click", () => {
    window.location.href = "/tela-inicial";
});

carregarCronograma();
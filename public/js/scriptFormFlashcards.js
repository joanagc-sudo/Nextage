
document.addEventListener("DOMContentLoaded", function () {

    const filtroDisciplina = document.getElementById(
        "filtroDisciplinaFlashcard"
    );

    const filtroConteudo = document.getElementById(
        "id_conteudo"
    );

    if (!filtroDisciplina || !filtroConteudo) {
        return;
    }

    // Guarda todas as opções de conteúdo
    const opcoesConteudo = Array.from(
        filtroConteudo.querySelectorAll("option")
    ).filter(function (opcao) {
        return opcao.value !== "";
    });

    // Guarda o conteúdo que já estava selecionado
    const conteudoInicial = filtroConteudo.value;

    // Organiza as disciplinas encontradas
    const disciplinas = new Set();

    opcoesConteudo.forEach(function (opcao) {

        const disciplina = opcao.dataset.disciplina;

        if (disciplina) {
            disciplinas.add(disciplina);
        }

    });

    // Adiciona as disciplinas ao filtro
    disciplinas.forEach(function (disciplina) {

        const option = document.createElement("option");

        option.value = disciplina;
        option.textContent = disciplina;

        filtroDisciplina.appendChild(option);

    });

    // Atualiza os conteúdos conforme a disciplina
    function atualizarConteudos() {

        const disciplinaSelecionada =
            filtroDisciplina.value;

        filtroConteudo.innerHTML = "";

        const opcaoInicial = document.createElement("option");

        opcaoInicial.value = "";
        opcaoInicial.textContent = "Selecione um conteúdo";

        filtroConteudo.appendChild(opcaoInicial);

        opcoesConteudo.forEach(function (opcao) {

            if (
                disciplinaSelecionada === "" ||
                opcao.dataset.disciplina === disciplinaSelecionada
            ) {

                filtroConteudo.appendChild(
                    opcao.cloneNode(true)
                );

            }

        });

    }

    // Quando a disciplina for selecionada
    filtroDisciplina.addEventListener("change", function () {

        atualizarConteudos();

    });

    // Mantém a disciplina e o conteúdo selecionados
    // quando a página é aberta para editar
    if (conteudoInicial) {

        const opcaoSelecionada = opcoesConteudo.find(
            function (opcao) {
                return opcao.value === conteudoInicial;
            }
        );

        if (opcaoSelecionada) {

            filtroDisciplina.value =
                opcaoSelecionada.dataset.disciplina;

        }

    }

    atualizarConteudos();

    // Restaura o conteúdo selecionado na edição
    if (conteudoInicial) {
        filtroConteudo.value = conteudoInicial;
    }

});

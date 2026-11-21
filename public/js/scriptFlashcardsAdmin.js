
document.addEventListener("DOMContentLoaded", function () {

    const filtroDisciplina = document.getElementById("filtroDisciplina");
    const filtroConteudo = document.getElementById("filtroConteudo");

    const flashcards = document.querySelectorAll(".flashcard-admin");
    const mensagemFiltro = document.getElementById("mensagemFiltro");

    // Verifica se os filtros existem na página
    if (!filtroDisciplina || !filtroConteudo) {
        return;
    }

    // Remove espaços extras e facilita a comparação
    function normalizarTexto(texto) {
        return texto
            .trim()
            .toLowerCase();
    }

    // Guarda as disciplinas encontradas
    const disciplinas = new Set();

    // Guarda os conteúdos encontrados
    const conteudos = new Set();

    // Percorre todos os flashcards cadastrados
    flashcards.forEach(function (flashcard) {

        const disciplina = flashcard.dataset.disciplina;
        const conteudo = flashcard.dataset.conteudo;

        if (disciplina) {
            disciplinas.add(disciplina);
        }

        if (conteudo) {
            conteudos.add(conteudo);
        }

    });

    // Adiciona as disciplinas ao filtro
    disciplinas.forEach(function (disciplina) {

        const option = document.createElement("option");

        option.value = disciplina;
        option.textContent = disciplina;

        filtroDisciplina.appendChild(option);

    });

    // Atualiza os conteúdos conforme a disciplina escolhida
    function atualizarFiltroConteudo() {

        const disciplinaSelecionada =
            normalizarTexto(filtroDisciplina.value);

        // Limpa as opções anteriores
        filtroConteudo.innerHTML = "";

        const opcaoTodos = document.createElement("option");

        opcaoTodos.value = "";
        opcaoTodos.textContent = "Todos os conteúdos";

        filtroConteudo.appendChild(opcaoTodos);

        const conteudosDisponiveis = new Set();

        // Busca os conteúdos dos flashcards da disciplina
        flashcards.forEach(function (flashcard) {

            const disciplina =
                normalizarTexto(flashcard.dataset.disciplina);

            const conteudo =
                flashcard.dataset.conteudo;

            if (
                disciplinaSelecionada === "" ||
                disciplina === disciplinaSelecionada
            ) {
                conteudosDisponiveis.add(conteudo);
            }

        });

        // Adiciona os conteúdos encontrados
        conteudosDisponiveis.forEach(function (conteudo) {

            const option = document.createElement("option");

            option.value = conteudo;
            option.textContent = conteudo;

            filtroConteudo.appendChild(option);

        });

    }

    // Filtra os flashcards exibidos
    function filtrarFlashcards() {

        const disciplinaSelecionada =
            normalizarTexto(filtroDisciplina.value);

        const conteudoSelecionado =
            normalizarTexto(filtroConteudo.value);

        let encontrados = 0;

        flashcards.forEach(function (flashcard) {

            const disciplina =
                normalizarTexto(flashcard.dataset.disciplina);

            const conteudo =
                normalizarTexto(flashcard.dataset.conteudo);

            const correspondeDisciplina =
                disciplinaSelecionada === "" ||
                disciplina === disciplinaSelecionada;

            const correspondeConteudo =
                conteudoSelecionado === "" ||
                conteudo === conteudoSelecionado;

            if (
                correspondeDisciplina &&
                correspondeConteudo
            ) {

                flashcard.style.display = "";
                encontrados++;

            } else {

                flashcard.style.display = "none";

            }

        });

        // Mostra mensagem se nenhum cartão for encontrado
        if (mensagemFiltro) {

            mensagemFiltro.style.display =
                encontrados === 0 ? "block" : "none";

        }

    }

    // Quando a disciplina mudar
    filtroDisciplina.addEventListener("change", function () {

        atualizarFiltroConteudo();
        filtrarFlashcards();

    });

    // Quando o conteúdo mudar
    filtroConteudo.addEventListener("change", function () {

        filtrarFlashcards();

    });

    // Inicializa os filtros
    atualizarFiltroConteudo();
    filtrarFlashcards();

});

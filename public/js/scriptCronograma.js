
    const btnEditar = document.getElementById("btnEditar");
    const btnExcluir = document.getElementById("btnExcluir");
    const btnSalvar = document.getElementById("btnSalvar");

    const celulas = document.querySelectorAll(".tabela-cronograma tbody td");

    let editando = false;
    let celulaSelecionada = null;

    btnEditar.addEventListener("click", function () {

        editando = !editando;

        celulas.forEach(function (celula) {
            celula.contentEditable = editando;
        });

        if (editando) {
            btnEditar.textContent = "Finalizar edição";
        } else {btnEditar.textContent = "Editar";
    }

    });

    celulas.forEach(function (celula) {

        celula.addEventListener("click", function () {

            if (!editando) {
                return;
            }

            celulas.forEach(function (item) {
                item.classList.remove("celula-selecionada");
            });

            celulaSelecionada = celula;

            celula.classList.add("celula-selecionada");

        });

    });

    btnExcluir.addEventListener("click", function () {

        if (celulaSelecionada) {
            celulaSelecionada.textContent = "";
            celulaSelecionada.classList.remove("celula-selecionada");
            celulaSelecionada = null;

        } else {

            alert("Selecione uma atividade para excluir.");

        }

    });
    
    btnSalvar.addEventListener("click", function () {

        alert("Cronograma salvo!");

    });


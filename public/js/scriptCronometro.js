//Script do cronometro

document.addEventListener("DOMContentLoaded", function () {

    const botaoCronometro =
        document.getElementById("botaoCronometro");

    const painelCronometro =
        document.getElementById("painelCronometro");

    const fecharCronometro =
        document.getElementById("fecharCronometro");

    const tempoCronometro =
        document.getElementById("tempoCronometro");

    const estadoCronometro =
        document.getElementById("estadoCronometro");

    const iniciarPausar =
        document.getElementById("iniciarPausar");

    const iconeIniciarPausar =
        document.getElementById("iconeIniciarPausar");

    const marcarVolta =
        document.getElementById("marcarVolta");

    const zerarCronometro =
        document.getElementById("zerarCronometro");

    const listaMarcacoes =
        document.getElementById("listaMarcacoes");

    const quantidadeMarcacoes =
        document.getElementById("quantidadeMarcacoes");

    let tempoAcumulado = 0;
    let inicioContagem = null;
    let intervalo = null;
    let executando = false;
    let marcacoes = [];

    // Abre e minimiza o painel
    botaoCronometro.addEventListener("click", function () {
        painelCronometro.hidden = !painelCronometro.hidden;
        botaoCronometro.hidden = !painelCronometro.hidden;
    });

    fecharCronometro.addEventListener("click", function () {
        painelCronometro.hidden = true;
        botaoCronometro.hidden = false;
    });

    // Calcula o tempo decorrido em milissegundos
    function obterTempo() {
        if (executando) {
            return tempoAcumulado + (Date.now() - inicioContagem);
        }

        return tempoAcumulado;
    }

    // Formata em horas, minutos e segundos
    function formatarTempo(milissegundos) {
        const totalSegundos = Math.floor(milissegundos / 1000);

        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        const segundos = totalSegundos % 60;

        return [
            String(horas).padStart(2, "0"),
            String(minutos).padStart(2, "0"),
            String(segundos).padStart(2, "0")
        ].join(":");
    }

    function atualizarTempo() {
        tempoCronometro.textContent =
            formatarTempo(obterTempo());
    }

    // Inicia ou pausa
    iniciarPausar.addEventListener("click", function () {

        if (executando) {
          
            tempoAcumulado = obterTempo();
            executando = false;

            clearInterval(intervalo);
            intervalo = null;

            iconeIniciarPausar.textContent = "▶";
            iniciarPausar.setAttribute(
                "aria-label", "Continuar cronômetro"
            );

            estadoCronometro.textContent = "Cronômetro pausado";

        } else {
            // Iniciar ou continuar
            inicioContagem = Date.now();
            executando = true;

            intervalo = setInterval(atualizarTempo, 200);

            iconeIniciarPausar.textContent = "Ⅱ";
            iniciarPausar.setAttribute(
                "aria-label", "Pausar cronômetro"
            );

            estadoCronometro.textContent = "Hora de focar nos estudos!";
            marcarVolta.disabled = false;
        }

        atualizarTempo();
    });

    // Registra uma marcação sem parar o cronômetro
    marcarVolta.addEventListener("click", function () {

        if (!executando) {
            return;
        }

        marcacoes.unshift({
            numero: marcacoes.length + 1,
            tempo: obterTempo()
        });

        renderizarMarcacoes();
    });

    function renderizarMarcacoes() {
        listaMarcacoes.replaceChildren();

        quantidadeMarcacoes.textContent = marcacoes.length;

        if (marcacoes.length === 0) {
            const mensagem = document.createElement("p");
            mensagem.className = "sem-marcacoes";
            mensagem.textContent =
                "Suas marcações aparecerão aqui.";

            listaMarcacoes.appendChild(mensagem);
            return;
        }

        marcacoes.forEach(function (marcacao) {
            const item = document.createElement("div");
            item.className = "item-marcacao";

            const texto = document.createElement("span");
            texto.textContent = "Marcação " + marcacao.numero;

            const tempo = document.createElement("strong");
            tempo.textContent = formatarTempo(marcacao.tempo);

            item.appendChild(texto);
            item.appendChild(tempo);

            listaMarcacoes.appendChild(item);
        });
    }

    // Zera o cronômetro e apaga as marcações
    zerarCronometro.addEventListener("click", function () {

        const confirmar = window.confirm(
            "Deseja zerar o cronômetro e apagar todas as marcações?"
        );

        if (!confirmar) {
            return;
        }

        clearInterval(intervalo);
        intervalo = null;

        tempoAcumulado = 0;
        inicioContagem = null;
        executando = false;
        marcacoes = [];

        tempoCronometro.textContent = "00:00:00";
        iconeIniciarPausar.textContent = "▶";

        iniciarPausar.setAttribute(
            "aria-label", "Iniciar cronômetro"
        );

        marcarVolta.disabled = true;

        estadoCronometro.textContent = "Pronto para começar?";

        renderizarMarcacoes();
    });

    renderizarMarcacoes();
});



    // Seleciona todas as mensagens que possuem role="alert"
    const alertas = document.querySelectorAll('[role="alert"]');


    // Para cada alerta encontrado
    alertas.forEach(function (alerta) {

        // Aguarda 2 segundos
        setTimeout(function () {

            // Esconde o alerta
            alerta.style.display = "none";

        }, 2000);

    });


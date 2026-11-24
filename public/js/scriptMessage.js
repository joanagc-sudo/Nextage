
document.addEventListener("DOMContentLoaded", function () {

    const alertas = document.querySelectorAll(
        "#alerta-sucesso, #alerta-danger, #alerta-warning"
    );

    alertas.forEach(function (alerta) {

        // Observa quando a mensagem aparece na tela.
        const observador = new MutationObserver(function () {

            if (!alerta.classList.contains("d-none")) {

                // Evita iniciar o temporizador várias vezes.
                observador.disconnect();

                setTimeout(function () {

                    alerta.style.transition = "opacity 0.5s ease";
                    alerta.style.opacity = "0";

                    setTimeout(function () {

                        alerta.classList.add("d-none");
                        alerta.style.opacity = "1";

                    }, 500);

                }, 3000);

            }

        });

        observador.observe(alerta, {
            attributes: true,
            attributeFilter: ["class"]
        });

    });

});
